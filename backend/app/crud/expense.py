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
# GET BUDGET FOR CATEGORY
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
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == user_id,
            Expense.category == category,
            func.extract("year", Expense.date) == year,
            func.extract("month", Expense.date) == month
        )
        .scalar()
    )

    return total or 0


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

    # Save expense first so it can be included
    # in the monthly total.
    db.commit()
    db.refresh(expense)

    # ======================================================
    # BUDGET ALERT LOGIC
    # ======================================================

    expense_date = expense.date

    year = expense_date.year
    month = expense_date.month

    # Budget uses YYYY-MM format
    month_year = f"{year:04d}-{month:02d}"

    # ------------------------------------------------------
    # FIND BUDGET
    # ------------------------------------------------------

    budget = get_budget_for_category(
        db,
        user_id,
        expense.category,
        month_year
    )

    if budget:

        # --------------------------------------------------
        # CALCULATE TOTAL SPENT
        # --------------------------------------------------

        total_spent = get_total_spent_this_month(
            db,
            user_id,
            expense.category,
            year,
            month
        )

        # --------------------------------------------------
        # CREATE NOTIFICATION IF BUDGET EXCEEDED
        # --------------------------------------------------

        if total_spent > budget.monthly_limit:

            notification = Notification(
                user_id=user_id,
                message=f"You've exceeded your {expense.category} budget",
                type="budget_alert",
                is_read=False,
                created_at=datetime.utcnow()
            )

            db.add(notification)
            db.commit()

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