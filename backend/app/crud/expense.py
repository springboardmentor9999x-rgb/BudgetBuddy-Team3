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
    """
    Find the budget for the user's category and month.

    Category comparison is case-insensitive.
    """

    return (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id,
            func.lower(Budget.category) == category.lower(),
            Budget.month_year == month_year
        )
        .order_by(Budget.id.desc())
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
    """
    Calculate total expenses for the user's category
    during the specified month.

    Category comparison is case-insensitive.
    """

    total = (
        db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0
            )
        )
        .filter(
            Expense.user_id == user_id,

            func.lower(Expense.category) ==
            category.lower(),

            func.extract(
                "year",
                Expense.date
            ) == year,

            func.extract(
                "month",
                Expense.date
            ) == month
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
    Check whether the user's category budget has been
    exceeded after an expense.

    Creates one unread notification for the category/month.

    If an unread alert already exists for the same
    category/month, its message and time are updated.
    """

    # ------------------------------------------------------
    # EXPENSE DATE
    # ------------------------------------------------------

    expense_date = expense.date

    if not expense_date:
        return None

    year = expense_date.year
    month = expense_date.month

    month_year = f"{year:04d}-{month:02d}"

    category = expense.category

    # ------------------------------------------------------
    # FIND MATCHING BUDGET
    # ------------------------------------------------------

    budget = get_budget_for_category(
        db=db,
        user_id=user_id,
        category=category,
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
        category=category,
        year=year,
        month=month
    )

    # ------------------------------------------------------
    # BUDGET NOT EXCEEDED
    # ------------------------------------------------------

    if total_spent <= float(budget.monthly_limit):
        return None

    # ------------------------------------------------------
    # CREATE NOTIFICATION MESSAGE
    # ------------------------------------------------------

    notification_message = (
        f"You've exceeded your {category} budget. "
        f"Spent ₹{total_spent:.2f} "
        f"of ₹{float(budget.monthly_limit):.2f}."
    )

    # ------------------------------------------------------
    # FIND EXISTING UNREAD ALERT
    #
    # We identify the category from the beginning of
    # the notification message.
    # ------------------------------------------------------

    existing_notification = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.type == "budget_alert",
            Notification.message.like(
                f"You've exceeded your {category} budget.%"
            ),
            Notification.is_read.is_(False)
        )
        .order_by(
            Notification.created_at.desc()
        )
        .first()
    )

    # ------------------------------------------------------
    # UPDATE EXISTING ALERT
    # ------------------------------------------------------

    if existing_notification:

        existing_notification.message = (
            notification_message
        )

        existing_notification.created_at = (
            datetime.utcnow()
        )

        db.commit()
        db.refresh(
            existing_notification
        )

        return existing_notification

    # ------------------------------------------------------
    # CREATE NEW ALERT
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
                BankAccount.id ==
                expense_in.bank_account_id,

                BankAccount.user_id ==
                user_id
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

    # ------------------------------------------------------
    # CHECK BUDGET
    # ------------------------------------------------------

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
    limit: int = 100,
    month: int | None = None,
    year: int | None = None
):
    """
    Get expenses for the user.

    If month and year are provided, only expenses belonging
    to that specific month are returned.

    If month/year are not provided, all expenses are returned.

    This keeps the existing endpoint behaviour intact for
    requests that do not use month filtering.
    """

    query = (
        db.query(Expense)
        .filter(
            Expense.user_id == user_id
        )
    )

    # ------------------------------------------------------
    # MONTH FILTER
    # ------------------------------------------------------
    # Example:
    # month = 8
    # year = 2026
    #
    # Start:
    # 2026-08-01 00:00:00
    #
    # End:
    # 2026-09-01 00:00:00
    #
    # Using >= start and < end safely handles DateTime values.
    # ------------------------------------------------------

    if month is not None and year is not None:

        start_date = datetime(
            year,
            month,
            1
        )

        if month == 12:

            end_date = datetime(
                year + 1,
                1,
                1
            )

        else:

            end_date = datetime(
                year,
                month + 1,
                1
            )

        query = query.filter(
            Expense.date >= start_date,
            Expense.date < end_date
        )

    # ------------------------------------------------------
    # ORDER BY NEWEST FIRST
    # ------------------------------------------------------

    query = query.order_by(
        Expense.date.desc()
    )

    # ------------------------------------------------------
    # PAGINATION
    # ------------------------------------------------------

    return (
        query
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
                BankAccount.id ==
                expense.bank_account_id,

                BankAccount.user_id ==
                user_id
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
                BankAccount.id ==
                expense_in.bank_account_id,

                BankAccount.user_id ==
                user_id
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
        setattr(
            expense,
            key,
            value
        )

    db.commit()
    db.refresh(expense)

    # ------------------------------------------------------
    # CHECK BUDGET AGAIN
    # ------------------------------------------------------

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
    # RESTORE BANK BALANCE
    # ------------------------------------------------------

    if expense.bank_account_id is not None:

        account = (
            db.query(BankAccount)
            .filter(
                BankAccount.id ==
                expense.bank_account_id,

                BankAccount.user_id ==
                user_id
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