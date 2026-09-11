from decimal import Decimal
from datetime import datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.savings_goal import SavingsGoal
from app.models.notification import Notification
from app.models.bank_account import BankAccount
from app.schemas.savings_goal import SavingsGoalCreate
# ==========================================================
# GET ONE SAVINGS GOAL
# ==========================================================

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


# ==========================================================
# CREATE SAVINGS GOAL
# ==========================================================

def create_savings_goal(
    db: Session,
    user_id: int,
    goal_in: SavingsGoalCreate
):

    bank_account = (
        db.query(BankAccount)
        .filter(
            BankAccount.id ==
            goal_in.bank_account_id,
            BankAccount.user_id ==
            user_id
        )
        .first()
    )

    if not bank_account:
        raise ValueError(
            "Selected bank account was not found."
        )

    existing_goal = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == user_id,
            SavingsGoal.title == goal_in.title
        )
        .first()
    )

    if existing_goal:
        raise ValueError(
            f"A savings goal named "
            f"'{goal_in.title}' already exists."
        )

    goal = SavingsGoal(
        user_id=user_id,
        title=goal_in.title,
        target_amount=goal_in.target_amount,
        current_amount=goal_in.current_amount,
        target_date=goal_in.target_date,
        status="in_progress",
        bank_account_id=goal_in.bank_account_id
    )

    db.add(goal)

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise ValueError(
            f"A savings goal named "
            f"'{goal_in.title}' already exists."
        )

    except Exception:

        db.rollback()
        raise

    db.refresh(goal)

    return goal


# ==========================================================
# GET ALL SAVINGS GOALS
# ==========================================================

def get_savings_goals_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100
):

    return (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == user_id
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==========================================================
# UPDATE SAVINGS GOAL
# ==========================================================

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

    bank_account = (
        db.query(BankAccount)
        .filter(
            BankAccount.id ==
            goal_in.bank_account_id,
            BankAccount.user_id ==
            user_id
        )
        .first()
    )

    if not bank_account:
        raise ValueError(
            "Selected bank account was not found."
        )

    existing_goal = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == user_id,
            SavingsGoal.title == goal_in.title,
            SavingsGoal.id != goal_id
        )
        .first()
    )

    if existing_goal:
        raise ValueError(
            f"A savings goal named "
            f"'{goal_in.title}' already exists."
        )

    old_amount = Decimal(
        str(goal.current_amount)
    )

    new_amount = Decimal(
        str(goal_in.current_amount)
    )

    difference = (
        new_amount -
        old_amount
    )

    # ------------------------------------------------------
    # HANDLE BANK BALANCE
    # ------------------------------------------------------

    if difference != Decimal("0"):

        selected_bank_account = (
            db.query(BankAccount)
            .filter(
                BankAccount.id ==
                goal_in.bank_account_id,
                BankAccount.user_id ==
                user_id
            )
            .first()
        )

        if not selected_bank_account:
            raise ValueError(
                "Selected bank account was not found."
            )

        bank_balance = Decimal(
            str(selected_bank_account.balance)
        )

        if difference > Decimal("0"):

            if bank_balance < difference:
                raise ValueError(
                    "Insufficient bank account balance. "
                    f"Available balance: "
                    f"₹{bank_balance:.2f}"
                )

            selected_bank_account.balance = float(
                bank_balance -
                difference
            )

        else:

            refund_amount = abs(
                difference
            )

            selected_bank_account.balance = float(
                bank_balance +
                refund_amount
            )

    # ------------------------------------------------------
    # UPDATE GOAL
    # ------------------------------------------------------

    goal.title = goal_in.title
    goal.target_amount = goal_in.target_amount
    goal.current_amount = goal_in.current_amount
    goal.target_date = goal_in.target_date
    goal.bank_account_id = goal_in.bank_account_id

    # ------------------------------------------------------
    # STATUS
    # ------------------------------------------------------

    target_amount = Decimal(
        str(goal.target_amount)
    )

    current_amount = Decimal(
        str(goal.current_amount)
    )

    if current_amount >= target_amount:

        goal.status = "completed"

    else:

        goal.status = "in_progress"

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise ValueError(
            f"A savings goal named "
            f"'{goal.title}' already exists."
        )

    except Exception:

        db.rollback()
        raise

    db.refresh(goal)

    return goal


# ==========================================================
# DELETE SAVINGS GOAL
# ==========================================================

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

    saved_amount = Decimal(
        str(goal.current_amount)
    )

    if saved_amount > Decimal("0"):

        bank_account = None

        if goal.bank_account_id:

            bank_account = (
                db.query(BankAccount)
                .filter(
                    BankAccount.id ==
                    goal.bank_account_id,
                    BankAccount.user_id ==
                    user_id
                )
                .first()
            )

        if not bank_account:

            bank_account = (
                db.query(BankAccount)
                .filter(
                    BankAccount.user_id ==
                    user_id
                )
                .order_by(
                    BankAccount.id
                )
                .first()
            )

        if not bank_account:
            raise ValueError(
                "No bank account found to refund "
                "the saved amount."
            )

        bank_balance = Decimal(
            str(bank_account.balance)
        )

        bank_account.balance = float(
            bank_balance +
            saved_amount
        )

    db.delete(goal)

    try:

        db.commit()

    except Exception:

        db.rollback()
        raise

    return goal


# ==========================================================
# CHECK WHETHER NOTIFICATION ALREADY EXISTS
# ==========================================================

def notification_exists(
    db: Session,
    user_id: int,
    notification_type: str,
    message: str
):
    """
    Prevent duplicate savings milestone notifications.

    This makes the protection explicit instead of relying
    only on the old/new percentage calculation.
    """

    return (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.type == notification_type,
            Notification.message == message
        )
        .first()
        is not None
    )


# ==========================================================
# CONTRIBUTE TO SAVINGS GOAL
# ==========================================================

def contribute_to_savings_goal(
    db: Session,
    goal_id: int,
    user_id: int,
    amount: Decimal
):

    # ------------------------------------------------------
    # GET GOAL
    # ------------------------------------------------------

    goal = get_savings_goal(
        db,
        goal_id,
        user_id
    )

    if not goal:
        return None

    # ------------------------------------------------------
    # VALIDATE CONTRIBUTION
    # ------------------------------------------------------

    if amount <= Decimal("0"):

        raise ValueError(
            "Contribution amount must be greater than zero."
        )

    # ------------------------------------------------------
    # GET ASSIGNED BANK ACCOUNT
    # ------------------------------------------------------

    if not goal.bank_account_id:

        raise ValueError(
            "No bank account is assigned to this savings goal."
        )

    bank_account = (
        db.query(BankAccount)
        .filter(
            BankAccount.id ==
            goal.bank_account_id,
            BankAccount.user_id ==
            user_id
        )
        .first()
    )

    if not bank_account:

        raise ValueError(
            "The bank account assigned to this goal "
            "was not found."
        )

    # ------------------------------------------------------
    # CHECK BANK BALANCE
    # ------------------------------------------------------

    bank_balance = Decimal(
        str(bank_account.balance)
    )

    if bank_balance < amount:

        raise ValueError(
            "Insufficient balance in the selected "
            f"bank account. Available balance: "
            f"₹{bank_balance:.2f}"
        )

    # ------------------------------------------------------
    # CURRENT AMOUNT
    # ------------------------------------------------------

    old_amount = Decimal(
        str(goal.current_amount)
    )

    target_amount = Decimal(
        str(goal.target_amount)
    )

    if target_amount <= Decimal("0"):

        raise ValueError(
            "Savings goal target amount must be greater than zero."
        )

    # ------------------------------------------------------
    # REMAINING AMOUNT
    # ------------------------------------------------------

    remaining_amount = (
        target_amount -
        old_amount
    )

    if remaining_amount <= Decimal("0"):

        raise ValueError(
            "This savings goal is already completed."
        )

    # ------------------------------------------------------
    # PREVENT OVER-CONTRIBUTION
    # ------------------------------------------------------

    if amount > remaining_amount:

        raise ValueError(
            "Contribution cannot exceed the remaining "
            f"goal amount of ₹{remaining_amount:.2f}"
        )

    # ------------------------------------------------------
    # OLD PROGRESS
    # ------------------------------------------------------

    old_progress = (
        old_amount /
        target_amount
    ) * Decimal("100")

    # ------------------------------------------------------
    # DEDUCT FROM BANK
    # ------------------------------------------------------

    bank_account.balance = float(
        bank_balance -
        amount
    )

    # ------------------------------------------------------
    # UPDATE GOAL AMOUNT
    # ------------------------------------------------------

    new_goal_amount = (
        old_amount +
        amount
    )

    goal.current_amount = (
        new_goal_amount
    )

    # ------------------------------------------------------
    # NEW PROGRESS
    # ------------------------------------------------------

    new_progress = (
        new_goal_amount /
        target_amount
    ) * Decimal("100")

    # ------------------------------------------------------
    # MILESTONE CHECKS
    # ------------------------------------------------------

    crossed_70_percent = (
        old_progress < Decimal("70")
        and
        new_progress >= Decimal("70")
    )

    completed_goal = (
        old_progress < Decimal("100")
        and
        new_progress >= Decimal("100")
    )

    # ------------------------------------------------------
    # UPDATE STATUS
    # ------------------------------------------------------

    if completed_goal:

        goal.status = "completed"

    else:

        goal.status = "in_progress"

    # ======================================================
    # 70% NOTIFICATION
    # ======================================================

    if crossed_70_percent:

        milestone_message = (
            f"Great progress! You've reached 70% "
            f"of your {goal.title} savings goal."
        )

        # --------------------------------------------------
        # PREVENT DUPLICATE 70% NOTIFICATION
        # --------------------------------------------------

        already_exists = notification_exists(
            db=db,
            user_id=user_id,
            notification_type="goal_milestone",
            message=milestone_message
        )

        if not already_exists:

            milestone_notification = Notification(
                user_id=user_id,
                message=milestone_message,
                type="goal_milestone",
                is_read=False,
                created_at=datetime.utcnow()
            )

            db.add(
                milestone_notification
            )

    # ======================================================
    # 100% COMPLETION NOTIFICATION
    # ======================================================

    if completed_goal:

        completion_message = (
            f"Congratulations! You've completed "
            f"your {goal.title} savings goal!"
        )

        # --------------------------------------------------
        # PREVENT DUPLICATE COMPLETION NOTIFICATION
        # --------------------------------------------------

        already_exists = notification_exists(
            db=db,
            user_id=user_id,
            notification_type="goal_completed",
            message=completion_message
        )

        if not already_exists:

            completion_notification = Notification(
                user_id=user_id,
                message=completion_message,
                type="goal_completed",
                is_read=False,
                created_at=datetime.utcnow()
            )

            db.add(
                completion_notification
            )

    # ------------------------------------------------------
    # SAVE GOAL + BANK + NOTIFICATIONS TOGETHER
    # ------------------------------------------------------

    try:

        db.commit()

    except Exception:

        db.rollback()
        raise

    # ------------------------------------------------------
    # REFRESH GOAL
    # ------------------------------------------------------

    db.refresh(goal)

    return goal