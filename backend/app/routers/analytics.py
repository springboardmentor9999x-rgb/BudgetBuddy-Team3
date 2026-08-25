from fastapi import APIRouter, Depends, Query
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
    month: int | None = Query(
        default=None,
        ge=1,
        le=12
    ),
    year: int | None = Query(
        default=None,
        ge=2000,
        le=2100
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return analytics_crud.get_spending_by_category(
        db=db,
        user_id=current_user.id,
        month=month,
        year=year
    )


# ==========================================================
# MONTHLY TREND
# ==========================================================

@router.get(
    "/monthly-trend",
    response_model=list[MonthlyTrendOut]
)
def monthly_trend(
    months: int = Query(
        default=6,
        ge=1,
        le=24
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return analytics_crud.get_monthly_trend(
        db=db,
        user_id=current_user.id,
        months=months
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
        db=db,
        user_id=current_user.id
    )


# ==========================================================
# ANALYTICS SUMMARY
# ==========================================================

@router.get(
    "/summary",
    response_model=AnalyticsSummaryOut
)
def analytics_summary(
    month: int | None = Query(
        default=None,
        ge=1,
        le=12
    ),
    year: int | None = Query(
        default=None,
        ge=2000,
        le=2100
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return analytics_crud.get_analytics_summary(
        db=db,
        user_id=current_user.id,
        month=month,
        year=year
    )