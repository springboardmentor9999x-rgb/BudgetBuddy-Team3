# backend/app/routers/analytics.py

from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    Query,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.crud.analytics import (
    get_spending_by_category,
    get_trend,
    get_savings_progress,
    get_analytics_summary,
    get_monthly_account_balance,
)

from app.core.deps import require_user

from app.models.user import User


# ==========================================================
# ROUTER
# ==========================================================

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


# ==========================================================
# ROLE CONSTANTS
# ==========================================================

BASIC_ROLE = "user"

PREMIUM_ROLES = {
    "premium",
    "admin",
}


# ==========================================================
# HELPER — NORMALIZE ROLE
# ==========================================================

def get_user_role(user: User) -> str:
    """
    Return the user's role in normalized form.

    Supports both:
        - normal string roles
        - Enum-style roles with a .value attribute
    """

    role = getattr(
        user,
        "role",
        BASIC_ROLE,
    )

    # ------------------------------------------------------
    # SQLAlchemy/Python Enum support
    # ------------------------------------------------------

    if hasattr(role, "value"):
        role = role.value

    return (
        str(role)
        .strip()
        .lower()
    )


# ==========================================================
# HELPER — ADVANCED ACCESS
# ==========================================================

def has_advanced_analytics_access(
    user: User,
) -> bool:
    """
    Premium and Admin users have access to
    advanced analytics features.
    """

    return (
        get_user_role(user)
        in PREMIUM_ROLES
    )


# ==========================================================
# HELPER — REQUIRE ADVANCED ACCESS
# ==========================================================

def require_advanced_analytics(
    user: User,
):
    """
    Block advanced analytics for basic users.

    HTTP 403 is returned instead of silently
    exposing advanced analytics.
    """

    if not has_advanced_analytics_access(user):

        raise HTTPException(
            status_code=403,
            detail=(
                "Advanced analytics is available "
                "only for Premium and Admin users."
            ),
        )

    return user


# ==========================================================
# HELPER — CURRENT MONTH
# ==========================================================

def get_current_month_year():
    """
    Return the current month and year.
    """

    today = date.today()

    return (
        today.month,
        today.year,
    )


# ==========================================================
# HELPER — RESOLVE MONTH/YEAR
# ==========================================================

def resolve_month_year(
    user: User,
    month: int | None,
    year: int | None,
):
    """
    Resolve month/year according to analytics access.

    BASIC USER
    ----------
    Always receives the current month/year.

    PREMIUM / ADMIN
    ---------------
    Can request a specific month/year.
    """

    current_month, current_year = (
        get_current_month_year()
    )

    # ------------------------------------------------------
    # BASIC USERS
    # ------------------------------------------------------

    if not has_advanced_analytics_access(user):

        return (
            current_month,
            current_year,
        )

    # ------------------------------------------------------
    # PREMIUM / ADMIN
    # ------------------------------------------------------

    resolved_month = (
        month
        if month is not None
        else current_month
    )

    resolved_year = (
        year
        if year is not None
        else current_year
    )

    return (
        resolved_month,
        resolved_year,
    )


# ==========================================================
# SPENDING BY CATEGORY
# ==========================================================

@router.get(
    "/spending-by-category"
)
def spending_by_category(
    month: int | None = Query(
        None,
        ge=1,
        le=12,
        description="Month number.",
    ),

    year: int | None = Query(
        None,
        ge=2000,
        le=2100,
        description="Year number.",
    ),

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_user
    ),
):
    """
    Return spending grouped by category.

    BASIC
    -----
    Current month only.

    PREMIUM / ADMIN
    ---------------
    Specific month/year can be requested.
    """

    month, year = resolve_month_year(
        user=current_user,
        month=month,
        year=year,
    )

    return get_spending_by_category(
        db=db,
        user_id=current_user.id,
        month=month,
        year=year,
    )


# ==========================================================
# MONTHLY / DAILY TREND
# ==========================================================

@router.get(
    "/monthly-trend"
)
def monthly_trend(
    months: int = Query(
        1,
        ge=1,
        le=24,
        description=(
            "Number of months for monthly trends."
        ),
    ),

    month: int | None = Query(
        None,
        ge=1,
        le=12,
        description=(
            "Last month of the requested trend."
        ),
    ),

    year: int | None = Query(
        None,
        ge=2000,
        le=2100,
        description=(
            "Last year of the requested trend."
        ),
    ),

    granularity: str = Query(
        "day",
        description=(
            "Trend granularity: "
            "'day' or 'month'."
        ),
    ),

    start_date: date | None = Query(
        None,
        description="Custom trend start date.",
    ),

    end_date: date | None = Query(
        None,
        description="Custom trend end date.",
    ),

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_user
    ),
):
    """
    Return income/expense trend data.

    BASIC USER
    ----------
    - Current month only
    - Daily granularity only
    - Historical data blocked
    - Multi-month data blocked
    - Custom date range blocked

    PREMIUM / ADMIN
    ---------------
    - Current or historical months
    - Daily or monthly granularity
    - Up to 24 months
    - Custom date ranges
    """

    user_is_advanced = (
        has_advanced_analytics_access(
            current_user
        )
    )

    # ======================================================
    # BASIC USER
    # ======================================================

    if not user_is_advanced:

        current_month, current_year = (
            get_current_month_year()
        )

        return get_trend(
            db=db,
            user_id=current_user.id,
            granularity="day",
            months=1,
            month=current_month,
            year=current_year,
            start_date=None,
            end_date=None,
        )

    # ======================================================
    # PREMIUM / ADMIN
    # ======================================================

    granularity = (
        granularity or "day"
    ).strip().lower()

    # ------------------------------------------------------
    # VALIDATE GRANULARITY
    # ------------------------------------------------------

    if granularity not in {
        "day",
        "month",
    }:

        raise HTTPException(
            status_code=400,
            detail=(
                "granularity must be "
                "'day' or 'month'."
            ),
        )

    # ------------------------------------------------------
    # CUSTOM DATE RANGE
    # ------------------------------------------------------

    custom_range_requested = (
        start_date is not None
        or end_date is not None
    )

    if custom_range_requested:

        if (
            start_date is None
            or end_date is None
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Both start_date and "
                    "end_date are required."
                ),
            )

        if start_date > end_date:

            raise HTTPException(
                status_code=400,
                detail=(
                    "start_date must be "
                    "before or equal to "
                    "end_date."
                ),
            )

        # Custom ranges are daily.

        granularity = "day"

    # ------------------------------------------------------
    # RESOLVE MONTH/YEAR
    # ------------------------------------------------------

    month, year = resolve_month_year(
        user=current_user,
        month=month,
        year=year,
    )

    # ------------------------------------------------------
    # RETURN ADVANCED TREND
    # ------------------------------------------------------

    return get_trend(
        db=db,
        user_id=current_user.id,
        granularity=granularity,
        months=months,
        month=month,
        year=year,
        start_date=start_date,
        end_date=end_date,
    )


# ==========================================================
# SAVINGS PROGRESS
# ==========================================================

@router.get(
    "/savings-progress"
)
def savings_progress(
    month: int | None = Query(
        None,
        ge=1,
        le=12,
        description="Month number.",
    ),

    year: int | None = Query(
        None,
        ge=2000,
        le=2100,
        description="Year number.",
    ),

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_user
    ),
):
    """
    Return savings goal progress.

    This is an advanced analytics feature.

    BASIC USER
    ----------
    Access denied.

    PREMIUM / ADMIN
    ---------------
    Can view savings progress.
    """

    require_advanced_analytics(
        current_user
    )

    month, year = resolve_month_year(
        user=current_user,
        month=month,
        year=year,
    )

    return get_savings_progress(
        db=db,
        user_id=current_user.id,
        month=month,
        year=year,
    )


# ==========================================================
# ANALYTICS SUMMARY
# ==========================================================

@router.get(
    "/summary"
)
def analytics_summary(
    month: int | None = Query(
        None,
        ge=1,
        le=12,
        description="Month number.",
    ),

    year: int | None = Query(
        None,
        ge=2000,
        le=2100,
        description="Year number.",
    ),

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_user
    ),
):
    """
    Return analytics summary.

    Response:

        total_income
        total_expenses
        net_balance
        savings_rate
        account_balance

    BASIC
    -----
    Current month only.

    PREMIUM / ADMIN
    ---------------
    Can select month/year.
    """

    month, year = resolve_month_year(
        user=current_user,
        month=month,
        year=year,
    )

    return get_analytics_summary(
        db=db,
        user_id=current_user.id,
        month=month,
        year=year,
    )


# ==========================================================
# ACCOUNT BALANCE
# ==========================================================

@router.get(
    "/account-balance"
)
def account_balance(
    month: int | None = Query(
        None,
        ge=1,
        le=12,
        description="Month number.",
    ),

    year: int | None = Query(
        None,
        ge=2000,
        le=2100,
        description="Year number.",
    ),

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_user
    ),
):
    """
    Return account balance for a selected period.

    This is an advanced analytics feature.

    BASIC USER
    ----------
    Access denied.

    PREMIUM / ADMIN
    ---------------
    Can select month/year.
    """

    require_advanced_analytics(
        current_user
    )

    month, year = resolve_month_year(
        user=current_user,
        month=month,
        year=year,
    )

    balance = get_monthly_account_balance(
        db=db,
        user_id=current_user.id,
        month=month,
        year=year,
    )

    return {
        "account_balance": balance
    }