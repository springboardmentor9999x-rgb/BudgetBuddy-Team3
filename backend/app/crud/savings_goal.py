from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.savings_goal import SavingsGoal
from app.models.notification import Notification
from app.models.bank_account import BankAccount
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


# ==========================================================
# CREATE SAVINGS GOAL
# ==========================================================

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
#
# If current_amount is reduced:
#     Difference is REFUNDED to bank account.
#
# If current_amount is increased:
#     Difference is DEDUCTED from bank account.
#
# Example:
#     Old = 5000
#     New = 3000
#     Bank gets +2000
#
#     Old = 5000
#     New = 7000
#     Bank gets -2000
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

    # ------------------------------------------------------
    # OLD SAVINGS AMOUNT
    # ------------------------------------------------------

    old_amount = Decimal(
        str(goal.current_amount)
    )

    # ------------------------------------------------------
    # NEW SAVINGS AMOUNT
    # ------------------------------------------------------

    new_amount = Decimal(
        str(goal_in.current_amount)
    )

    # ------------------------------------------------------
    # CALCULATE DIFFERENCE
    # ------------------------------------------------------

    difference = new_amount - old_amount

    # ------------------------------------------------------
    # ONLY TOUCH BANK ACCOUNT IF AMOUNT CHANGED
    # ------------------------------------------------------

    if difference != Decimal("0"):

        bank_account = (
            db.query(BankAccount)
            .filter(
                BankAccount.user_id == user_id
            )
            .order_by(BankAccount.id)
            .first()
        )

        if not bank_account:
            raise ValueError(
                "No bank account found for this user"
            )

        bank_balance = Decimal(
            str(bank_account.balance)
        )

        # --------------------------------------------------
        # INCREASE SAVINGS
        # --------------------------------------------------

        if difference > Decimal("0"):

            if bank_balance < difference:
                raise ValueError(
                    f"Insufficient bank account balance. "
                    f"Available balance: ₹{bank_balance:.2f}"
                )

            bank_account.balance = float(
                bank_balance - difference
            )

        # --------------------------------------------------
        # DECREASE SAVINGS
        #
        # Refund the difference to bank account.
        # --------------------------------------------------

        else:

            refund_amount = abs(difference)

            bank_account.balance = float(
                bank_balance + refund_amount
            )

    # ------------------------------------------------------
    # UPDATE GOAL FIELDS
    # ------------------------------------------------------

    update_data = goal_in.model_dump()

    for key, value in update_data.items():
        setattr(goal, key, value)

    # ------------------------------------------------------
    # UPDATE STATUS AUTOMATICALLY
    # ------------------------------------------------------

    target_amount = Decimal(
        str(goal.target_amount)
    )

    current_amount = Decimal(
        str(goal.current_amount)
    )

    if current_amount >= target_amount:
        goal.status = "completed"

    elif current_amount < target_amount:
        goal.status = "in_progress"

    # ------------------------------------------------------
    # SAVE EVERYTHING TOGETHER
    # ------------------------------------------------------

    try:
        db.commit()

    except Exception:
        db.rollback()
        raise

    db.refresh(goal)

    return goal


# ==========================================================
# DELETE SAVINGS GOAL
#
# If the goal contains money:
#     Refund entire current_amount to bank account.
#
# Example:
#
#     Savings Goal = 5000
#     Bank = 5500
#
#     Delete goal
#
#     Savings Goal = deleted
#     Bank = 10500
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

    # ------------------------------------------------------
    # AMOUNT TO REFUND
    # ------------------------------------------------------

    saved_amount = Decimal(
        str(goal.current_amount)
    )

    # ------------------------------------------------------
    # REFUND MONEY TO BANK
    # ------------------------------------------------------

    if saved_amount > Decimal("0"):

        bank_account = (
            db.query(BankAccount)
            .filter(
                BankAccount.user_id == user_id
            )
            .order_by(BankAccount.id)
            .first()
        )

        if not bank_account:
            raise ValueError(
                "No bank account found for this user"
            )

        bank_balance = Decimal(
            str(bank_account.balance)
        )

        bank_account.balance = float(
            bank_balance + saved_amount
        )

    # ------------------------------------------------------
    # DELETE GOAL
    # ------------------------------------------------------

    db.delete(goal)

    # ------------------------------------------------------
    # SAVE BANK REFUND + DELETE TOGETHER
    # ------------------------------------------------------

    try:
        db.commit()

    except Exception:
        db.rollback()
        raise

    return goal


# ==========================================================
# CONTRIBUTE TO SAVINGS GOAL
#
# Contribution:
#     Bank balance decreases
#     Savings goal increases
#
# Example:
#     Bank = 10500
#     Contribution = 2000
#
#     Bank = 8500
#     Goal = +2000
# ==========================================================

def contribute_to_savings_goal(
    db: Session,
    goal_id: int,
    user_id: int,
    amount: Decimal
):
    # ======================================================
    # 1. GET SAVINGS GOAL
    # ======================================================

    goal = get_savings_goal(
        db,
        goal_id,
        user_id
    )

    if not goal:
        return None

    # ======================================================
    # 2. VALIDATE CONTRIBUTION
    # ======================================================

    if amount <= Decimal("0"):
        raise ValueError(
            "Contribution amount must be greater than zero"
        )

    # ======================================================
    # 3. FIND USER'S BANK ACCOUNT
    #
    # The savings goal does NOT need bank_account_id.
    # We automatically use the user's bank account.
    # ======================================================

    bank_account = (
        db.query(BankAccount)
        .filter(
            BankAccount.user_id == user_id
        )
        .order_by(BankAccount.id)
        .first()
    )

    if not bank_account:
        raise ValueError(
            "No bank account found for this user"
        )

    # ======================================================
    # 4. CHECK BANK BALANCE
    # ======================================================

    bank_balance = Decimal(
        str(bank_account.balance)
    )

    if bank_balance < amount:
        raise ValueError(
            f"Insufficient bank account balance. "
            f"Available balance: ₹{bank_balance:.2f}"
        )

    # ======================================================
    # 5. OLD SAVINGS AMOUNT
    # ======================================================

    old_amount = Decimal(
        str(goal.current_amount)
    )

    # ======================================================
    # 6. DEDUCT FROM BANK
    # ======================================================

    new_bank_balance = bank_balance - amount

    bank_account.balance = float(
        new_bank_balance
    )

    # ======================================================
    # 7. ADD TO SAVINGS GOAL
    # ======================================================

    new_goal_amount = old_amount + amount

    goal.current_amount = new_goal_amount

    # ======================================================
    # 8. CALCULATE MILESTONES
    # ======================================================

    target_amount = Decimal(
        str(goal.target_amount)
    )

    milestone_50 = target_amount * Decimal("0.50")
    milestone_100 = target_amount

    # ======================================================
    # 9. 100% GOAL COMPLETED
    # ======================================================

    if old_amount < milestone_100 <= new_goal_amount:

        goal.status = "completed"

        notification = Notification(
            user_id=user_id,
            message=(
                f"Congratulations! You've completed your "
                f"{goal.title} savings goal!"
            ),
            type="goal_milestone",
            is_read=False
        )

        db.add(notification)

    # ======================================================
    # 10. 50% MILESTONE
    # ======================================================

    elif old_amount < milestone_50 <= new_goal_amount:

        notification = Notification(
            user_id=user_id,
            message=(
                f"Congratulations! You've reached 50% of your "
                f"{goal.title} savings goal."
            ),
            type="goal_milestone",
            is_read=False
        )

        db.add(notification)

    # ======================================================
    # 11. SAVE BANK + GOAL + NOTIFICATION TOGETHER
    # ======================================================

    try:
        db.commit()

    except Exception:
        db.rollback()
        raise

    # ======================================================
    # 12. REFRESH
    # ======================================================

    db.refresh(goal)

    return goal
