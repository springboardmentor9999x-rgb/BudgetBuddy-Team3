"""
Analytics Service — Business Logic Layer
Handles all analytics queries for USER, PREMIUM_USER, and ADMIN roles.
"""
from datetime import date, timedelta
from typing import Optional
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.expense import Expense
from app.models.financial_goal import FinancialGoal
from app.models.goal_contribution import GoalContribution
from app.models.income import Income
from app.models.user import User


# ==========================================
# HELPER: Get date range for current month
# ==========================================

def current_month_range() -> tuple[date, date]:
    today = date.today()
    start = today.replace(day=1)
    # Last day of current month
    if today.month == 12:
        end = today.replace(month=12, day=31)
    else:
        end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
    return start, end


# ==========================================
# SERVICE: Spending by Category
# ==========================================

def get_spending_by_category(
    db: Session,
    user_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    role: str = "USER"
) -> list[dict]:
    """
    Returns spending grouped by category for the given date range.
    For USER role, always uses the current month (ignores custom dates).
    """
    if role == "USER" or start_date is None or end_date is None:
        start_date, end_date = current_month_range()

    # Get user categories
    categories = db.query(Category).filter(Category.user_id == user_id).all()
    cat_map = {c.category_id: c.name for c in categories}

    # Aggregate expenses by category in date range
    rows = db.query(
        Expense.category_id,
        func.sum(Expense.amount).label("total")
    ).filter(
        Expense.user_id == user_id,
        Expense.expense_date >= start_date,
        Expense.expense_date <= end_date
    ).group_by(Expense.category_id).all()

    total_spend = sum(float(r.total or 0) for r in rows)

    result = []
    for row in rows:
        amount = float(row.total or 0)
        pct = round((amount / total_spend * 100), 1) if total_spend > 0 else 0.0
        result.append({
            "category": cat_map.get(row.category_id, f"Category {row.category_id}"),
            "amount": amount,
            "percentage": pct
        })

    result.sort(key=lambda x: x["amount"], reverse=True)
    return result


# ==========================================
# SERVICE: Summary (Income, Expense, Net)
# ==========================================

def get_summary(
    db: Session,
    user_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    role: str = "USER"
) -> dict:
    """
    Returns total income, total expenses, net balance.
    For USER role, always uses the current month.
    """
    if role == "USER" or start_date is None or end_date is None:
        start_date, end_date = current_month_range()

    today = date.today()
    period_label = f"{today.strftime('%B %Y')}" if role == "USER" else \
        f"{start_date.strftime('%d %b %Y')} – {end_date.strftime('%d %b %Y')}"

    total_income = float(
        db.query(func.coalesce(func.sum(Income.amount), 0)).filter(
            Income.user_id == user_id,
            Income.income_date >= start_date,
            Income.income_date <= end_date
        ).scalar() or 0.0
    )

    total_expenses = float(
        db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date
        ).scalar() or 0.0
    )

    net_balance = total_income - total_expenses
    savings_rate = round((net_balance / total_income * 100), 1) if total_income > 0 else 0.0

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_balance": net_balance,
        "savings_rate": savings_rate,
        "period_label": period_label
    }


# ==========================================
# SERVICE: Monthly Trend (last N months)
# ==========================================

def get_monthly_trend(
    db: Session,
    user_id: int,
    months: int = 12
) -> list[dict]:
    """
    Returns income vs expense for each of the last N months.
    Premium/Admin only.
    """
    today = date.today()
    trend = []

    for i in range(months - 1, -1, -1):
        # Step back month by month
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1

        # Build start/end for this month
        m_start = date(year, month, 1)
        if month == 12:
            m_end = date(year, 12, 31)
        else:
            m_end = date(year, month + 1, 1) - timedelta(days=1)

        label = m_start.strftime("%B %Y")

        m_income = float(
            db.query(func.coalesce(func.sum(Income.amount), 0)).filter(
                Income.user_id == user_id,
                Income.income_date >= m_start,
                Income.income_date <= m_end
            ).scalar() or 0.0
        )

        m_expense = float(
            db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
                Expense.user_id == user_id,
                Expense.expense_date >= m_start,
                Expense.expense_date <= m_end
            ).scalar() or 0.0
        )

        trend.append({
            "month": label,
            "income": m_income,
            "expense": m_expense,
            "savings": m_income - m_expense
        })

    return trend


# ==========================================
# SERVICE: Category Spending Over Time
# ==========================================

def get_category_over_time(
    db: Session,
    user_id: int,
    months: int = 6
) -> list[dict]:
    """
    Returns per-category spending per month for last N months.
    Premium/Admin only.
    """
    today = date.today()
    categories = db.query(Category).filter(Category.user_id == user_id).all()
    cat_map = {c.category_id: c.name for c in categories}

    result = []

    for i in range(months - 1, -1, -1):
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1

        m_start = date(year, month, 1)
        if month == 12:
            m_end = date(year, 12, 31)
        else:
            m_end = date(year, month + 1, 1) - timedelta(days=1)

        label = m_start.strftime("%b %Y")

        rows = db.query(
            Expense.category_id,
            func.sum(Expense.amount).label("total")
        ).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= m_start,
            Expense.expense_date <= m_end
        ).group_by(Expense.category_id).all()

        month_data = {"month": label}
        for row in rows:
            cat_name = cat_map.get(row.category_id, f"Category {row.category_id}")
            month_data[cat_name] = float(row.total or 0)

        result.append(month_data)

    return result


# ==========================================
# SERVICE: Current vs Previous Month Comparison
# ==========================================

def get_comparison(
    db: Session,
    user_id: int
) -> dict:
    """
    Compares income and expense for current month vs previous month.
    Premium/Admin only.
    """
    today = date.today()

    # Current month
    cur_start = today.replace(day=1)
    if today.month == 12:
        cur_end = today.replace(month=12, day=31)
    else:
        cur_end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)

    # Previous month
    prev_month = today.month - 1 if today.month > 1 else 12
    prev_year = today.year if today.month > 1 else today.year - 1
    prev_start = date(prev_year, prev_month, 1)
    if prev_month == 12:
        prev_end = date(prev_year, 12, 31)
    else:
        prev_end = date(prev_year, prev_month + 1, 1) - timedelta(days=1)

    def month_totals(start, end):
        inc = float(
            db.query(func.coalesce(func.sum(Income.amount), 0)).filter(
                Income.user_id == user_id,
                Income.income_date >= start,
                Income.income_date <= end
            ).scalar() or 0.0
        )
        exp = float(
            db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
                Expense.user_id == user_id,
                Expense.expense_date >= start,
                Expense.expense_date <= end
            ).scalar() or 0.0
        )
        return inc, exp

    cur_income, cur_expense = month_totals(cur_start, cur_end)
    prev_income, prev_expense = month_totals(prev_start, prev_end)

    def pct_change(current, previous):
        if previous == 0:
            return None
        return round(((current - previous) / previous) * 100, 1)

    return {
        "current_month_label": cur_start.strftime("%B %Y"),
        "previous_month_label": prev_start.strftime("%B %Y"),
        "current_income": cur_income,
        "previous_income": prev_income,
        "income_change_pct": pct_change(cur_income, prev_income),
        "current_expense": cur_expense,
        "previous_expense": prev_expense,
        "expense_change_pct": pct_change(cur_expense, prev_expense),
        "current_savings": cur_income - cur_expense,
        "previous_savings": prev_income - prev_expense
    }


# ==========================================
# SERVICE: Savings Goals Progress
# ==========================================

def get_goals_progress(
    db: Session,
    user_id: int
) -> list[dict]:
    """
    Returns progress for all active financial goals.
    Available to all roles.
    """
    goals = db.query(FinancialGoal).filter(
        FinancialGoal.user_id == user_id
    ).order_by(FinancialGoal.goal_id.asc()).all()

    result = []
    for g in goals:
        target = float(g.target_amount) if g.target_amount else 0.0
        current = float(g.current_amount) if g.current_amount else 0.0
        progress = round((current / target * 100), 1) if target > 0 else 0.0

        result.append({
            "goal_id": g.goal_id,
            "goal_name": g.goal_name,
            "target_amount": target,
            "current_amount": current,
            "progress_percentage": min(progress, 100.0),
            "is_completed": current >= target if target > 0 else False,
            "deadline": str(g.deadline) if g.deadline else None
        })

    return result


# ==========================================
# SERVICE: System Analytics (Admin only)
# ==========================================

def get_system_analytics(db: Session) -> dict:
    """
    Returns aggregated platform-level metrics.
    Never exposes individual user financial data.
    Admin only.
    """
    total_users = db.query(func.count(User.user_id)).scalar() or 0
    premium_users = db.query(func.count(User.user_id)).filter(
        User.role == "PREMIUM_USER"
    ).scalar() or 0
    admin_users = db.query(func.count(User.user_id)).filter(
        User.role == "ADMIN"
    ).scalar() or 0

    # Active = users who have at least one income or expense record
    users_with_income = db.query(func.count(func.distinct(Income.user_id))).scalar() or 0
    users_with_expense = db.query(func.count(func.distinct(Expense.user_id))).scalar() or 0
    # Approximate active users (union estimate)
    active_users = max(users_with_income, users_with_expense)

    total_income_records = db.query(func.count(Income.income_id)).scalar() or 0
    total_expense_records = db.query(func.count(Expense.expense_id)).scalar() or 0

    total_income_volume = float(
        db.query(func.coalesce(func.sum(Income.amount), 0)).scalar() or 0.0
    )
    total_expense_volume = float(
        db.query(func.coalesce(func.sum(Expense.amount), 0)).scalar() or 0.0
    )

    from app.models.budget import Budget
    total_budgets = db.query(func.count(Budget.budget_id)).scalar() or 0
    total_goals = db.query(func.count(FinancialGoal.goal_id)).scalar() or 0

    # Platform-wide category spending (aggregated, no user data exposed)
    categories = db.query(Category).all()
    cat_map = {c.category_id: c.name for c in categories}

    cat_rows = db.query(
        Expense.category_id,
        func.sum(Expense.amount).label("total")
    ).group_by(Expense.category_id).order_by(
        func.sum(Expense.amount).desc()
    ).limit(10).all()

    top_categories = [
        {
            "category": cat_map.get(r.category_id, f"Category {r.category_id}"),
            "total_amount": float(r.total or 0)
        }
        for r in cat_rows
    ]

    return {
        "total_users": total_users,
        "total_active_users": active_users,
        "total_premium_users": premium_users,
        "total_admin_users": admin_users,
        "total_income_records": total_income_records,
        "total_expense_records": total_expense_records,
        "total_budgets": total_budgets,
        "total_goals": total_goals,
        "total_income_volume": total_income_volume,
        "total_expense_volume": total_expense_volume,
        "platform_net_savings": total_income_volume - total_expense_volume,
        "top_spending_categories": top_categories
    }


# ==========================================
# SERVICE: User Growth Over Time (Admin)
# ==========================================

def get_user_growth(db: Session, months: int = 12) -> list[dict]:
    """
    Returns new user registrations per month.
    Admin only — no individual user data exposed.
    """
    # Since users table has no created_at column, we approximate
    # by using user_id ranges. For now return a count-only structure.
    # If created_at is added later, this can be updated.
    total = db.query(func.count(User.user_id)).scalar() or 0
    return [{"note": "User growth tracking requires a created_at column on the users table.", "total_users": total}]
