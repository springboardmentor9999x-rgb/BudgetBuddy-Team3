from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.expense import Expense
from app.models.bank_account import BankAccount
from app.models.budget import Budget
from app.models.notification import Notification
from app.schemas.expense import ExpenseCreate


# ==========================================================
# GET SINGLE EXPENSE
# ==========================================================

def get_expense(
    db: Session,
    expense_id: int,
    user_id: int
):
    return (
        db.query(Expense)
        .filter(
            Expense.id == expense_id,
            Expense.user_id == user_id
        )
        .first()
    )


# ==========================================================
# GET BUDGET FOR CATEGORY AND MONTH
# ==========================================================

def get_budget_for_category(
    db: Session,
    user_id: int,
    category: str,
    month_year: str
):
    return (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id,
            Budget.category == category,
            Budget.month_year == month_year
        )
        .first()
    )


# ==========================================================
# GET TOTAL SPENT THIS MONTH FOR CATEGORY
# ==========================================================

def get_total_spent_this_month(
    db: Session,
    user_id: int,
    category: str,
    year: int,
    month: int
):
    total = (
        db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0
            )
        )
        .filter(
            Expense.user_id == user_id,
            Expense.category == category,
            func.extract("year", Expense.date) == year,
            func.extract("month", Expense.date) == month
        )
        .scalar()
    )

    return float(total or 0)


# ==========================================================
# CHECK BUDGET AND CREATE ALERT
# ==========================================================

def check_budget_alert(
    db: Session,
    user_id: int,
    expense: Expense
):
    """
    Check whether the expense causes the user's
    monthly category budget to be exceeded.

    If the budget is exceeded, create one unread
    budget notification for that category/month.
    """

    expense_date = expense.date

    year = expense_date.year
    month = expense_date.month

    # Budget uses YYYY-MM format
    month_year = f"{year:04d}-{month:02d}"

    # ------------------------------------------------------
    # FIND MATCHING BUDGET
    # ------------------------------------------------------

    budget = get_budget_for_category(
        db=db,
        user_id=user_id,
        category=expense.category,
        month_year=month_year
    )

    if not budget:
        return None

    # ------------------------------------------------------
    # CALCULATE TOTAL SPENDING
    # ------------------------------------------------------

    total_spent = get_total_spent_this_month(
        db=db,
        user_id=user_id,
        category=expense.category,
        year=year,
        month=month
    )

    # ------------------------------------------------------
    # CHECK WHETHER BUDGET IS EXCEEDED
    # ------------------------------------------------------

    if total_spent <= budget.monthly_limit:
        return None

    # ------------------------------------------------------
    # CHECK FOR EXISTING BUDGET ALERT
    # ------------------------------------------------------

    notification_message = (
        f"You've exceeded your {expense.category} budget. "
        f"Spent ₹{total_spent:.2f} of ₹{budget.monthly_limit:.2f}."
    )

    existing_notification = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.type == "budget_alert",
            Notification.message.like(
                f"You've exceeded your {expense.category} budget.%"
            ),
            Notification.is_read == False
        )
        .first()
    )

    # ------------------------------------------------------
    # DON'T CREATE DUPLICATE ALERT
    # ------------------------------------------------------

    if existing_notification:
        # Update the existing notification with the
        # latest spending amount.
        existing_notification.message = notification_message

        db.commit()
        db.refresh(existing_notification)

        return existing_notification

    # ------------------------------------------------------
    # CREATE NEW NOTIFICATION
    # ------------------------------------------------------

    notification = Notification(
        user_id=user_id,
        message=notification_message,
        type="budget_alert",
        is_read=False,
        created_at=datetime.utcnow()
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


# ==========================================================
# CREATE EXPENSE
# ==========================================================

def create_expense(
    db: Session,
    user_id: int,
    expense_in: ExpenseCreate
):
    account = None

    # ------------------------------------------------------
    # CHECK BANK ACCOUNT
    # ------------------------------------------------------

    if expense_in.bank_account_id is not None:

        account = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == expense_in.bank_account_id,
                BankAccount.user_id == user_id
            )
            .first()
        )

        if not account:
            return None

    # ------------------------------------------------------
    # CREATE EXPENSE
    # ------------------------------------------------------

    expense = Expense(
        user_id=user_id,
        **expense_in.model_dump()
    )

    db.add(expense)

    # ------------------------------------------------------
    # DEDUCT FROM BANK ACCOUNT
    # ------------------------------------------------------

    if account:
        account.balance -= expense_in.amount

    # ------------------------------------------------------
    # SAVE EXPENSE
    # ------------------------------------------------------

    db.commit()
    db.refresh(expense)

    # ======================================================
    # BUDGET ALERT
    # ======================================================

    check_budget_alert(
        db=db,
        user_id=user_id,
        expense=expense
    )

    return expense


# ==========================================================
# GET ALL EXPENSES
# ==========================================================

def get_expenses_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(Expense)
        .filter(
            Expense.user_id == user_id
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==========================================================
# UPDATE EXPENSE
# ==========================================================

def update_expense(
    db: Session,
    expense_id: int,
    user_id: int,
    expense_in: ExpenseCreate
):
    expense = get_expense(
        db,
        expense_id,
        user_id
    )

    if not expense:
        return None

    # ------------------------------------------------------
    # OLD BANK ACCOUNT
    # ------------------------------------------------------

    old_account = None

    if expense.bank_account_id is not None:

        old_account = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == expense.bank_account_id,
                BankAccount.user_id == user_id
            )
            .first()
        )

    # ------------------------------------------------------
    # NEW BANK ACCOUNT
    # ------------------------------------------------------

    new_account = None

    if expense_in.bank_account_id is not None:

        new_account = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == expense_in.bank_account_id,
                BankAccount.user_id == user_id
            )
            .first()
        )

        if not new_account:
            return None

    # ------------------------------------------------------
    # RESTORE OLD EXPENSE AMOUNT
    # ------------------------------------------------------

    if old_account:
        old_account.balance += expense.amount

    # ------------------------------------------------------
    # DEDUCT NEW EXPENSE AMOUNT
    # ------------------------------------------------------

    if new_account:
        new_account.balance -= expense_in.amount

    # ------------------------------------------------------
    # UPDATE EXPENSE
    # ------------------------------------------------------

    update_data = expense_in.model_dump()

    for key, value in update_data.items():
        setattr(expense, key, value)

    db.commit()
    db.refresh(expense)

    # ======================================================
    # CHECK BUDGET AFTER UPDATE
    # ======================================================

    check_budget_alert(
        db=db,
        user_id=user_id,
        expense=expense
    )

    return expense


# ==========================================================
# DELETE EXPENSE
# ==========================================================

def delete_expense(
    db: Session,
    expense_id: int,
    user_id: int
):
    expense = get_expense(
        db,
        expense_id,
        user_id
    )

    if not expense:
        return None

    # ------------------------------------------------------
    # RESTORE MONEY TO BANK ACCOUNT
    # ------------------------------------------------------

    if expense.bank_account_id is not None:

        account = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == expense.bank_account_id,
                BankAccount.user_id == user_id
            )
            .first()
        )

        if account:
            account.balance += expense.amount

    # ------------------------------------------------------
    # DELETE EXPENSE
    # ------------------------------------------------------

    db.delete(expense)
    db.commit()

    return expense