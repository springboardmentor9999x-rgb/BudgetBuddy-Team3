from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from decimal import Decimal

from app.database import get_db
from app.models.financial_goal import FinancialGoal
from app.models.goal_contribution import GoalContribution
from app.models.notification import Notification
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.financial_goal import (
    FinancialGoalCreate,
    FinancialGoalUpdate,
    FinancialGoalDeposit,
    FinancialGoalResponse
)

router = APIRouter(
    prefix="/goals",
    tags=["Savings Goals"]
)


def _format_currency(val) -> str:
    """Format numbers into clean currency representation (e.g., 5000 -> 5,000)."""
    v = float(val)
    if v.is_integer():
        return f"{int(v):,}"
    return f"{v:,.2f}"


def _safe_create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    action_url: str = "/savings-goals"
):
    """
    Safely create notification inside nested savepoint.
    If notification creation fails for any reason, the main savings goal
    operation remains unaffected.
    """
    try:
        with db.begin_nested():
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                action_url=action_url,
                is_read=False
            )
            db.add(notification)
            db.flush()
    except Exception as e:
        print(f"Warning: Failed to create notification '{title}': {e}")


def _has_achievement_notification(db: Session, user_id: int, goal_name: str) -> bool:
    """Check if an achievement notification was already created for this goal."""
    existing = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.title == "Savings Goal Achieved 🎉",
        Notification.message == f"Congratulations! Your savings goal '{goal_name}' has been achieved."
    ).first()
    return existing is not None


def _format_goal_response(goal: FinancialGoal) -> dict:
    target = float(goal.target_amount) if goal.target_amount else 0.0
    current = float(goal.current_amount) if goal.current_amount else 0.0
    progress = round((current / target * 100), 2) if target > 0 else 0.0
    is_completed = current >= target if target > 0 else False

    return {
        "goal_id": goal.goal_id,
        "user_id": goal.user_id,
        "goal_name": goal.goal_name,
        "target_amount": target,
        "current_amount": current,
        "deadline": goal.deadline,
        "progress_percentage": min(progress, 100.0),
        "is_completed": is_completed
    }


# ==========================================
# GET ALL MY SAVINGS GOALS
# ==========================================
@router.get("/", response_model=list[FinancialGoalResponse])
def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goals = db.query(FinancialGoal).filter(
        FinancialGoal.user_id == current_user.user_id
    ).order_by(FinancialGoal.goal_id.desc()).all()

    return [_format_goal_response(g) for g in goals]


# ==========================================
# CREATE SAVINGS GOAL
# ==========================================
@router.post("/", response_model=FinancialGoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_in: FinancialGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_goal = FinancialGoal(
        user_id=current_user.user_id,
        goal_name=goal_in.goal_name.strip(),
        target_amount=Decimal(str(goal_in.target_amount)),
        current_amount=Decimal(str(goal_in.current_amount or 0.0)),
        deadline=goal_in.deadline
    )

    db.add(new_goal)
    db.flush()

    # Notifications (failures must never break goal operation)
    try:
        # 1. Notification: New Savings Goal Created
        _safe_create_notification(
            db=db,
            user_id=current_user.user_id,
            title="New Savings Goal Created",
            message=f"Your savings goal '{new_goal.goal_name}' has been created successfully.",
            action_url="/savings-goals"
        )

        # 2. Notification: Savings Goal Achieved (if initial amount already reaches target)
        target = float(new_goal.target_amount) if new_goal.target_amount else 0.0
        current = float(new_goal.current_amount) if new_goal.current_amount else 0.0
        if target > 0 and current >= target:
            if not _has_achievement_notification(db, current_user.user_id, new_goal.goal_name):
                _safe_create_notification(
                    db=db,
                    user_id=current_user.user_id,
                    title="Savings Goal Achieved 🎉",
                    message=f"Congratulations! Your savings goal '{new_goal.goal_name}' has been achieved.",
                    action_url="/savings-goals"
                )
    except Exception as e:
        print(f"Warning: Notification failed during goal creation: {e}")

    db.commit()
    db.refresh(new_goal)

    return _format_goal_response(new_goal)


# ==========================================
# GET GOAL BY ID
# ==========================================
@router.get("/{goal_id}", response_model=FinancialGoalResponse)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.goal_id == goal_id,
        FinancialGoal.user_id == current_user.user_id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Savings goal not found"
        )

    return _format_goal_response(goal)


# ==========================================
# UPDATE SAVINGS GOAL
# ==========================================
@router.put("/{goal_id}", response_model=FinancialGoalResponse)
def update_goal(
    goal_id: int,
    goal_update: FinancialGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.goal_id == goal_id,
        FinancialGoal.user_id == current_user.user_id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Savings goal not found"
        )

    previous_target = float(goal.target_amount) if goal.target_amount else 0.0
    previous_current = float(goal.current_amount) if goal.current_amount else 0.0
    was_achieved = previous_target > 0 and previous_current >= previous_target

    if goal_update.goal_name is not None:
        goal.goal_name = goal_update.goal_name.strip()
    if goal_update.target_amount is not None:
        goal.target_amount = Decimal(str(goal_update.target_amount))
    if goal_update.current_amount is not None:
        goal.current_amount = Decimal(str(goal_update.current_amount))
    if goal_update.deadline is not None:
        goal.deadline = goal_update.deadline

    db.flush()

    # Notifications (failures must never break goal operation)
    try:
        # 1. Notification: Savings Goal Updated
        _safe_create_notification(
            db=db,
            user_id=current_user.user_id,
            title="Savings Goal Updated",
            message=f"Your savings goal '{goal.goal_name}' has been updated successfully.",
            action_url="/savings-goals"
        )

        # 2. Notification: Savings Goal Achieved (if transitioned to achieved state)
        new_target = float(goal.target_amount) if goal.target_amount else 0.0
        new_current = float(goal.current_amount) if goal.current_amount else 0.0
        is_achieved_now = new_target > 0 and new_current >= new_target

        if is_achieved_now and not was_achieved:
            if not _has_achievement_notification(db, current_user.user_id, goal.goal_name):
                _safe_create_notification(
                    db=db,
                    user_id=current_user.user_id,
                    title="Savings Goal Achieved 🎉",
                    message=f"Congratulations! Your savings goal '{goal.goal_name}' has been achieved.",
                    action_url="/savings-goals"
                )
    except Exception as e:
        print(f"Warning: Notification failed during goal update: {e}")

    db.commit()
    db.refresh(goal)

    return _format_goal_response(goal)


# ==========================================
# ADD DEPOSIT / SAVINGS TO GOAL
# ==========================================
@router.post("/{goal_id}/deposit", response_model=FinancialGoalResponse)
def deposit_to_goal(
    goal_id: int,
    deposit: FinancialGoalDeposit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.goal_id == goal_id,
        FinancialGoal.user_id == current_user.user_id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Savings goal not found"
        )

    if deposit.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Deposit amount must be greater than 0"
        )

    previous_amount = float(goal.current_amount or 0.0)
    target = float(goal.target_amount) if goal.target_amount else 0.0
    new_total = previous_amount + float(deposit.amount)
    goal.current_amount = Decimal(str(new_total))

    # Record deposit contribution for analytics/history
    contrib = GoalContribution(
        goal_id=goal.goal_id,
        user_id=current_user.user_id,
        amount=deposit.amount
    )
    db.add(contrib)
    db.flush()

    # Notifications (failures must never break goal operation)
    try:
        # 1. Notification: Money Added to Savings Goal
        _safe_create_notification(
            db=db,
            user_id=current_user.user_id,
            title="Money Added to Savings Goal",
            message=f"₹{_format_currency(deposit.amount)} has been added to your savings goal '{goal.goal_name}'.",
            action_url="/savings-goals"
        )

        # 2. Notification: Savings Goal Achieved (only when new_total >= target and previous_amount < target)
        if target > 0 and new_total >= target and previous_amount < target:
            if not _has_achievement_notification(db, current_user.user_id, goal.goal_name):
                _safe_create_notification(
                    db=db,
                    user_id=current_user.user_id,
                    title="Savings Goal Achieved 🎉",
                    message=f"Congratulations! Your savings goal '{goal.goal_name}' has been achieved.",
                    action_url="/savings-goals"
                )
    except Exception as e:
        print(f"Warning: Notification failed during goal deposit: {e}")

    db.commit()
    db.refresh(goal)

    return _format_goal_response(goal)


# ==========================================
# DELETE SAVINGS GOAL
# ==========================================
@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.goal_id == goal_id,
        FinancialGoal.user_id == current_user.user_id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Savings goal not found"
        )

    db.delete(goal)
    db.commit()

    return {
        "message": "Savings goal deleted successfully"
    }
