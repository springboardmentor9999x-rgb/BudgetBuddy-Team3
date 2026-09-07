"""
Admin Analytics Router
System-level analytics endpoints for ADMIN role only.
IMPORTANT: Never exposes individual user financial data — only aggregated metrics.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import require_admin
from app.services import analytics_service


router = APIRouter(
    prefix="/admin",
    tags=["Admin Analytics"]
)


# ==========================================
# SYSTEM ANALYTICS — PLATFORM OVERVIEW
# ==========================================

@router.get("/system-analytics")
def system_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Platform-wide aggregated analytics dashboard for admins.
    Returns ONLY aggregated/count data — never individual user financials.
    """
    return analytics_service.get_system_analytics(db)


# ==========================================
# USER GROWTH OVER TIME
# ==========================================

@router.get("/user-growth")
def user_growth(
    months: int = Query(12, ge=3, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Returns user growth metrics over time.
    Admin only.
    """
    return analytics_service.get_user_growth(db, months=months)


# ==========================================
# PLATFORM CATEGORY SUMMARY
# ==========================================

@router.get("/category-summary")
def category_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Platform-wide spending by category (aggregated across all users).
    Admin only — no individual user data exposed.
    """
    from sqlalchemy import func
    from app.models.expense import Expense
    from app.models.category import Category

    categories = db.query(Category).all()
    cat_map = {c.category_id: c.name for c in categories}

    rows = db.query(
        Expense.category_id,
        func.sum(Expense.amount).label("total"),
        func.count(Expense.expense_id).label("count")
    ).group_by(Expense.category_id).order_by(
        func.sum(Expense.amount).desc()
    ).all()

    result = []
    total_platform = sum(float(r.total or 0) for r in rows)

    for r in rows:
        amt = float(r.total or 0)
        result.append({
            "category": cat_map.get(r.category_id, f"Category {r.category_id}"),
            "total_amount": amt,
            "transaction_count": r.count,
            "platform_percentage": round((amt / total_platform * 100), 1) if total_platform > 0 else 0.0
        })

    return {
        "total_platform_spending": total_platform,
        "categories": result
    }


# ==========================================
# LIST ALL USERS (names + roles only)
# ==========================================

@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Returns list of all users with only name, email, and role.
    Financial data is NOT included.
    Admin only.
    """
    users = db.query(User).order_by(User.user_id.asc()).all()
    return [
        {
            "user_id": u.user_id,
            "name": u.name,
            "email": u.email,
            "role": u.role
        }
        for u in users
    ]
