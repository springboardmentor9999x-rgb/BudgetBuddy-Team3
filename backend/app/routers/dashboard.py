from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense


router = APIRouter()


@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Current date
    now = datetime.utcnow()

    current_month = now.month
    current_year = now.year

    # --------------------------------------------------
    # 1. Total income this month
    # --------------------------------------------------

    total_income = (
        db.query(func.sum(Income.amount))
        .filter(
            Income.user_id == current_user.id,
            extract("month", Income.date) == current_month,
            extract("year", Income.date) == current_year,
        )
        .scalar()
    )

    total_income = float(total_income or 0)

    # --------------------------------------------------
    # 2. Total expenses this month
    # --------------------------------------------------

    total_expenses = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == current_user.id,
            extract("month", Expense.date) == current_month,
            extract("year", Expense.date) == current_year,
        )
        .scalar()
    )

    total_expenses = float(total_expenses or 0)

    # --------------------------------------------------
    # 3. Balance
    # --------------------------------------------------

    balance = total_income - total_expenses

    # --------------------------------------------------
    # 4. Top 3 spending categories
    # --------------------------------------------------

    top_categories = (
        db.query(
            Expense.category,
            func.sum(Expense.amount).label("total"),
        )
        .filter(
            Expense.user_id == current_user.id,
            extract("month", Expense.date) == current_month,
            extract("year", Expense.date) == current_year,
        )
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .limit(3)
        .all()
    )

    top_3_categories = [
        {
            "category": category,
            "total": float(total),
        }
        for category, total in top_categories
    ]

    # --------------------------------------------------
    # 5. Recent 5 transactions
    # --------------------------------------------------

    expenses = (
        db.query(Expense)
        .filter(Expense.user_id == current_user.id)
        .order_by(Expense.date.desc())
        .limit(5)
        .all()
    )

    incomes = (
        db.query(Income)
        .filter(Income.user_id == current_user.id)
        .order_by(Income.date.desc())
        .limit(5)
        .all()
    )

    transactions = []

    for expense in expenses:
        transactions.append(
            {
                "id": expense.id,
                "type": "expense",
                "category": expense.category,
                "description": expense.description,
                "amount": float(expense.amount),
                "date": expense.date,
            }
        )

    for income in incomes:
        transactions.append(
            {
                "id": income.id,
                "type": "income",
                "source": income.source,
                "notes": income.notes,
                "amount": float(income.amount),
                "date": income.date,
            }
        )

    # Sort combined transactions by date
    transactions.sort(
        key=lambda transaction: transaction["date"],
        reverse=True,
    )

    # Keep only latest 5
    recent_transactions = transactions[:5]

    # --------------------------------------------------
    # Final dashboard response
    # --------------------------------------------------

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": balance,
        "top_3_categories": top_3_categories,
        "recent_transactions": recent_transactions,
    }