from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.savings_goal import SavingsGoal
from app.models.notification import Notification
from app.schemas.savings_goal import SavingsGoalCreate


def get_savings_goal(
    db: Session,
    goal_id: int,
    user_id: int
):
    return (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.id == goal_id,
            SavingsGoal.user_id == user_id
        )
        .first()
    )


def create_savings_goal(
    db: Session,
    user_id: int,
    goal_in: SavingsGoalCreate
):
    goal = SavingsGoal(
        user_id=user_id,
        **goal_in.model_dump()
    )

    db.add(goal)
    db.commit()
    db.refresh(goal)

    return goal


def get_savings_goals_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(SavingsGoal)
        .filter(SavingsGoal.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_savings_goal(
    db: Session,
    goal_id: int,
    user_id: int,
    goal_in: SavingsGoalCreate
):
    goal = get_savings_goal(
        db,
        goal_id,
        user_id
    )

    if not goal:
        return None

    update_data = goal_in.model_dump()

    for key, value in update_data.items():
        setattr(goal, key, value)

    db.commit()
    db.refresh(goal)

    return goal


def delete_savings_goal(
    db: Session,
    goal_id: int,
    user_id: int
):
    goal = get_savings_goal(
        db,
        goal_id,
        user_id
    )

    if not goal:
        return None

    db.delete(goal)
    db.commit()

    return goal


def contribute_to_savings_goal(
    db: Session,
    goal_id: int,
    user_id: int,
    amount: Decimal
):
    goal = get_savings_goal(
        db,
        goal_id,
        user_id
    )

    if not goal:
        return None

    # Store amount before contribution
    old_amount = Decimal(str(goal.current_amount))

    # Add contribution
    goal.current_amount = old_amount + amount

    target_amount = Decimal(str(goal.target_amount))

    # Calculate 50% milestone
    milestone_50 = target_amount * Decimal("0.50")

    # Calculate 100% milestone
    milestone_100 = target_amount

    # --------------------------------------------------
    # 100% GOAL COMPLETED
    # --------------------------------------------------

    if old_amount < milestone_100 <= goal.current_amount:

        goal.status = "completed"

        notification = Notification(
            user_id=user_id,
            message=f"Congratulations! You've completed your {goal.title} savings goal!",
            type="goal_milestone",
            is_read=False
        )

        db.add(notification)

    # --------------------------------------------------
    # 50% MILESTONE
    # --------------------------------------------------

    elif old_amount < milestone_50 <= goal.current_amount:

        notification = Notification(
            user_id=user_id,
            message=f"Congratulations! You've reached 50% of your {goal.title} savings goal.",
            type="goal_milestone",
            is_read=False
        )

        db.add(notification)

    # Save goal + notification together
    db.commit()
    db.refresh(goal)

    return goal