from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from decimal import Decimal

from app.database import get_db
from app.models.financial_goal import FinancialGoal
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

    # Add notification for new savings goal
    notification = Notification(
        user_id=current_user.user_id,
        title="🎯 New Savings Goal Created",
        message=f"Target: ₹{goal_in.target_amount:,.2f} for '{goal_in.goal_name}'. Start saving now!",
        is_read=False
    )
    db.add(notification)

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

    if goal_update.goal_name is not None:
        goal.goal_name = goal_update.goal_name.strip()
    if goal_update.target_amount is not None:
        goal.target_amount = Decimal(str(goal_update.target_amount))
    if goal_update.current_amount is not None:
        goal.current_amount = Decimal(str(goal_update.current_amount))
    if goal_update.deadline is not None:
        goal.deadline = goal_update.deadline

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
    new_total = previous_amount + float(deposit.amount)
    goal.current_amount = Decimal(str(new_total))

    target = float(goal.target_amount)

    # If goal reached or exceeded target, trigger completion notification
    if new_total >= target and previous_amount < target:
        notification = Notification(
            user_id=current_user.user_id,
            title="🎉 Goal Completed!",
            message=f"Congratulations! You reached your savings goal '{goal.goal_name}' with ₹{new_total:,.2f}!",
            is_read=False
        )
        db.add(notification)
    else:
        notification = Notification(
            user_id=current_user.user_id,
            title="💰 Savings Added",
            message=f"Added ₹{deposit.amount:,.2f} to '{goal.goal_name}'. Current total: ₹{new_total:,.2f} ({min(round(new_total/target*100), 100)}%).",
            is_read=False
        )
        db.add(notification)

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
