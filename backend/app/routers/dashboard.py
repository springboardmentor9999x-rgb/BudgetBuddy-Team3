from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.account import Account
from app.models.budget import Budget
from app.models.category import Category
from app.models.expense import Expense
from app.models.financial_goal import FinancialGoal
from app.models.income import Income
from app.models.user import User
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.user_id
    today = date.today()
    cur_year = today.year
    cur_month = today.month

    # 1. Total Income
    total_income = float(
        db.query(func.coalesce(func.sum(Income.amount), 0)).filter(
            Income.user_id == user_id
        ).scalar() or 0.0
    )

    # 2. Total Expenses
    total_expenses = float(
        db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.user_id == user_id
        ).scalar() or 0.0
    )

    # 3. Total Account Balance
    account_sum = float(
        db.query(func.coalesce(func.sum(Account.balance), 0)).filter(
            Account.user_id == user_id
        ).scalar() or 0.0
    )
    total_balance = account_sum if account_sum > 0 else max(total_income - total_expenses, 0.0)

    # 4. Net Savings
    savings = total_income - total_expenses

    # 5. Current Month Budget Status
    budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
    current_budget = None
    for b in budgets:
        if b.month and b.month.year == cur_year and b.month.month == cur_month:
            current_budget = b
            break

    monthly_budget_amount = float(current_budget.amount) if current_budget else 0.0

    month_spent = float(
        db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.user_id == user_id,
            extract("year", Expense.expense_date) == cur_year,
            extract("month", Expense.expense_date) == cur_month
        ).scalar() or 0.0
    )

    budget_remaining = monthly_budget_amount - month_spent
    budget_usage_pct = round((month_spent / monthly_budget_amount * 100), 1) if monthly_budget_amount > 0 else 0.0

    # 6. Category Breakdown (Expenses)
    categories = db.query(Category).filter(Category.user_id == user_id).all()
    cat_map = {c.category_id: c.name for c in categories}

    expense_by_cat = db.query(
        Expense.category_id,
        func.sum(Expense.amount).label("cat_total")
    ).filter(
        Expense.user_id == user_id
    ).group_by(Expense.category_id).all()

    category_breakdown = []
    for cat_id, cat_sum in expense_by_cat:
        cat_amount = float(cat_sum or 0.0)
        pct = round((cat_amount / total_expenses * 100), 1) if total_expenses > 0 else 0.0
        category_breakdown.append({
            "category_id": cat_id,
            "category_name": cat_map.get(cat_id, f"Category {cat_id}"),
            "amount": cat_amount,
            "percentage": pct
        })

    category_breakdown.sort(key=lambda x: x["amount"], reverse=True)

    # 7. Monthly Trends (Last 6 Months)
    monthly_trends = []
    for i in range(5, -1, -1):
        # Approximate month calculation
        m_date = today.replace(day=1) - timedelta(days=i * 28)
        m_year = m_date.year
        m_month = m_date.month
        m_label = m_date.strftime("%b %Y")

        m_inc = float(
            db.query(func.coalesce(func.sum(Income.amount), 0)).filter(
                Income.user_id == user_id,
                extract("year", Income.income_date) == m_year,
                extract("month", Income.income_date) == m_month
            ).scalar() or 0.0
        )

        m_exp = float(
            db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
                Expense.user_id == user_id,
                extract("year", Expense.expense_date) == m_year,
                extract("month", Expense.expense_date) == m_month
            ).scalar() or 0.0
        )

        monthly_trends.append({
            "month": m_label,
            "income": m_inc,
            "expense": m_exp,
            "savings": m_inc - m_exp
        })

    # 8. Recent Incomes and Expenses
    recent_incomes = db.query(Income).filter(
        Income.user_id == user_id
    ).order_by(Income.income_date.desc(), Income.income_id.desc()).limit(5).all()

    recent_expenses = db.query(Expense).filter(
        Expense.user_id == user_id
    ).order_by(Expense.expense_date.desc(), Expense.expense_id.desc()).limit(5).all()

    # 9. Savings Goals Summary
    goals = db.query(FinancialGoal).filter(
        FinancialGoal.user_id == user_id
    ).all()

    goals_summary = []
    for g in goals:
        t = float(g.target_amount) if g.target_amount else 0.0
        c = float(g.current_amount) if g.current_amount else 0.0
        p = min(round((c / t * 100), 1), 100.0) if t > 0 else 0.0
        goals_summary.append({
            "goal_id": g.goal_id,
            "goal_name": g.goal_name,
            "target_amount": t,
            "current_amount": c,
            "progress_percentage": p,
            "is_completed": c >= t if t > 0 else False
        })

    return {
        "summary": {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "total_balance": total_balance,
            "savings": savings,
            "savings_rate": round((savings / total_income * 100), 1) if total_income > 0 else 0.0
        },
        "budget": {
            "monthly_budget": monthly_budget_amount,
            "spent": month_spent,
            "remaining": budget_remaining,
            "usage_percentage": budget_usage_pct,
            "is_overspent": month_spent > monthly_budget_amount if monthly_budget_amount > 0 else False,
            "is_warning": budget_usage_pct >= 80.0 and month_spent <= monthly_budget_amount if monthly_budget_amount > 0 else False,
            "month_label": today.strftime("%B %Y")
        },
        "category_breakdown": category_breakdown,
        "monthly_trends": monthly_trends,
        "recent_incomes": [
            {
                "income_id": inc.income_id,
                "amount": float(inc.amount),
                "source": inc.source,
                "description": inc.description,
                "income_date": str(inc.income_date),
                "bank_name": inc.bank_name
            } for inc in recent_incomes
        ],
        "recent_expenses": [
            {
                "expense_id": exp.expense_id,
                "amount": float(exp.amount),
                "category_id": exp.category_id,
                "category_name": cat_map.get(exp.category_id, f"Category {exp.category_id}"),
                "description": exp.description,
                "expense_date": str(exp.expense_date)
            } for exp in recent_expenses
        ],
        "savings_goals": goals_summary
    }
