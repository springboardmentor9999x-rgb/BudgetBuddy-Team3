from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User

from app.crud import analytics as analytics_crud

from app.schemas.analytics import (
    SpendingByCategoryOut,
    MonthlyTrendOut,
    SavingsProgressOut,
    AnalyticsSummaryOut
)


# ==========================================================
# ANALYTICS ROUTER
# ==========================================================

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


# ==========================================================
# SPENDING BY CATEGORY
# ==========================================================

@router.get(
    "/spending-by-category",
    response_model=list[SpendingByCategoryOut]
)
def spending_by_category(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return analytics_crud.get_spending_by_category(
        db,
        current_user.id
    )


# ==========================================================
# MONTHLY TREND
# ==========================================================

@router.get(
    "/monthly-trend",
    response_model=list[MonthlyTrendOut]
)
def monthly_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return analytics_crud.get_monthly_trend(
        db,
        current_user.id,
        months=6
    )


# ==========================================================
# SAVINGS PROGRESS
# ==========================================================

@router.get(
    "/savings-progress",
    response_model=list[SavingsProgressOut]
)
def savings_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return analytics_crud.get_savings_progress(
        db,
        current_user.id
    )


# ==========================================================
# ANALYTICS SUMMARY
# ==========================================================

@router.get(
    "/summary",
    response_model=AnalyticsSummaryOut
)
def analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return analytics_crud.get_analytics_summary(
        db,
        current_user.id
    )