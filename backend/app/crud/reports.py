from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.models.income import Income
from app.models.expense import Expense


# ==========================================================
# MONTHLY REPORT
# ==========================================================

def get_monthly_report(
    db: Session,
    user_id: int,
    month: int,
    year: int
):
    # ------------------------------------------------------
    # TOTAL INCOME
    # ------------------------------------------------------

    total_income = (
        db.query(func.sum(Income.amount))
        .filter(
            Income.user_id == user_id,
            extract("month", Income.date) == month,
            extract("year", Income.date) == year
        )
        .scalar()
    )

    total_income = float(total_income or 0)

    # ------------------------------------------------------
    # TOTAL EXPENSES
    # ------------------------------------------------------

    total_expenses = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == user_id,
            extract("month", Expense.date) == month,
            extract("year", Expense.date) == year
        )
        .scalar()
    )

    total_expenses = float(total_expenses or 0)

    # ------------------------------------------------------
    # BALANCE
    # ------------------------------------------------------

    balance = total_income - total_expenses

    # ------------------------------------------------------
    # SPENDING BY CATEGORY
    # ------------------------------------------------------

    categories = (
        db.query(
            Expense.category.label("category"),
            func.sum(Expense.amount).label("total")
        )
        .filter(
            Expense.user_id == user_id,
            extract("month", Expense.date) == month,
            extract("year", Expense.date) == year
        )
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    spending_by_category = [
        {
            "category": category,
            "total": float(total or 0)
        }
        for category, total in categories
    ]

    return {
        "month": month,
        "year": year,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": balance,
        "spending_by_category": spending_by_category
    }