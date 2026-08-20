from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.models.expense import Expense
from app.models.income import Income
from app.models.savings_goal import SavingsGoal


# ==========================================================
# SPENDING BY CATEGORY
# ==========================================================

def get_spending_by_category(
    db: Session,
    user_id: int
):
    """
    Returns total spending grouped by expense category
    for the current month.
    """

    now = datetime.utcnow()

    results = (
        db.query(
            Expense.category.label("category"),
            func.sum(Expense.amount).label("total")
        )
        .filter(
            Expense.user_id == user_id,
            extract("year", Expense.date) == now.year,
            extract("month", Expense.date) == now.month
        )
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    return [
        {
            "category": category,
            "total": float(total or 0)
        }
        for category, total in results
    ]


# ==========================================================
# MONTHLY TREND
# ==========================================================

def get_monthly_trend(
    db: Session,
    user_id: int,
    months: int = 6
):
    """
    Returns income and expense totals for the last
    `months` months.

    Months with no transactions are included with 0 values.
    """

    now = datetime.utcnow()

    # ------------------------------------------------------
    # Get income grouped by year and month
    # ------------------------------------------------------

    income_results = (
        db.query(
            extract("year", Income.date).label("year"),
            extract("month", Income.date).label("month"),
            func.sum(Income.amount).label("total")
        )
        .filter(
            Income.user_id == user_id
        )
        .group_by(
            extract("year", Income.date),
            extract("month", Income.date)
        )
        .all()
    )

    # ------------------------------------------------------
    # Get expenses grouped by year and month
    # ------------------------------------------------------

    expense_results = (
        db.query(
            extract("year", Expense.date).label("year"),
            extract("month", Expense.date).label("month"),
            func.sum(Expense.amount).label("total")
        )
        .filter(
            Expense.user_id == user_id
        )
        .group_by(
            extract("year", Expense.date),
            extract("month", Expense.date)
        )
        .all()
    )

    # ------------------------------------------------------
    # Convert database results into dictionaries
    # ------------------------------------------------------

    income_map = {
        (int(year), int(month)): float(total or 0)
        for year, month, total in income_results
    }

    expense_map = {
        (int(year), int(month)): float(total or 0)
        for year, month, total in expense_results
    }

    # ------------------------------------------------------
    # Build rolling month list
    # ------------------------------------------------------

    result = []

    year = now.year
    month = now.month

    for _ in range(months):

        key = (year, month)

        result.append(
            {
                "month": f"{year:04d}-{month:02d}",
                "total_income": income_map.get(key, 0),
                "total_expenses": expense_map.get(key, 0)
            }
        )

        # Move one month backwards
        month -= 1

        if month == 0:
            month = 12
            year -= 1

    # We generated newest -> oldest.
    # Reverse so frontend charts display oldest -> newest.
    result.reverse()

    return result


# ==========================================================
# SAVINGS PROGRESS
# ==========================================================

def get_savings_progress(
    db: Session,
    user_id: int
):
    """
    Returns all savings goals with completion percentage.
    """

    goals = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == user_id
        )
        .order_by(SavingsGoal.created_at.desc())
        .all()
    )

    result = []

    for goal in goals:

        target_amount = float(goal.target_amount or 0)
        current_amount = float(goal.current_amount or 0)

        # --------------------------------------------------
        # Protect against division by zero
        # --------------------------------------------------

        if target_amount > 0:
            percentage = (
                current_amount / target_amount
            ) * 100
        else:
            percentage = 0

        # --------------------------------------------------
        # Prevent percentage above 100
        # --------------------------------------------------

        percentage = min(percentage, 100)

        result.append(
            {
                "id": goal.id,
                "title": goal.title,
                "target_amount": target_amount,
                "current_amount": current_amount,
                "percentage": round(percentage, 2),
                "status": goal.status
            }
        )

    return result


# ==========================================================
# ANALYTICS SUMMARY
# ==========================================================

def get_analytics_summary(
    db: Session,
    user_id: int
):
    """
    Returns current month's income, expenses,
    net balance and savings rate.
    """

    now = datetime.utcnow()

    # ------------------------------------------------------
    # TOTAL INCOME
    # ------------------------------------------------------

    total_income = (
        db.query(func.sum(Income.amount))
        .filter(
            Income.user_id == user_id,
            extract("year", Income.date) == now.year,
            extract("month", Income.date) == now.month
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
            extract("year", Expense.date) == now.year,
            extract("month", Expense.date) == now.month
        )
        .scalar()
    )

    total_expenses = float(total_expenses or 0)

    # ------------------------------------------------------
    # NET BALANCE
    # ------------------------------------------------------

    net_balance = total_income - total_expenses

    # ------------------------------------------------------
    # SAVINGS RATE
    # ------------------------------------------------------

    if total_income > 0:
        savings_rate = (
            net_balance / total_income
        ) * 100
    else:
        savings_rate = 0

    return {
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "net_balance": round(net_balance, 2),
        "savings_rate": round(savings_rate, 2)
    }