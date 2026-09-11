from datetime import datetime, date, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import func, extract, cast, Date

from app.models.expense import Expense
from app.models.income import Income
from app.models.savings_goal import SavingsGoal
from app.models.bank_account import BankAccount


# ==========================================================
# MONTH NAMES
# ==========================================================

MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]


# ==========================================================
# HELPER — SELECTED PERIOD
# ==========================================================

def _get_selected_period(
    month: int | None = None,
    year: int | None = None,
):
    """
    Returns the selected month/year.

    If month/year are not provided,
    the current system month/year are used.
    """

    now = datetime.now()

    selected_month = (
        month
        if month is not None
        else now.month
    )

    selected_year = (
        year
        if year is not None
        else now.year
    )

    return selected_month, selected_year


# ==========================================================
# HELPER — MONTH DATE RANGE
# ==========================================================

def _get_month_date_range(
    month: int,
    year: int,
):
    """
    Returns:

        first_day_of_month
        last_day_of_month
    """

    first_day = date(
        year,
        month,
        1,
    )

    if month == 12:

        next_month = date(
            year + 1,
            1,
            1,
        )

    else:

        next_month = date(
            year,
            month + 1,
            1,
        )

    last_day = (
        next_month
        - timedelta(days=1)
    )

    return first_day, last_day


# ==========================================================
# SPENDING BY CATEGORY
# ==========================================================

def get_spending_by_category(
    db: Session,
    user_id: int,
    month: int | None = None,
    year: int | None = None,
):

    selected_month, selected_year = (
        _get_selected_period(
            month,
            year,
        )
    )

    results = (
        db.query(
            Expense.category.label("category"),
            func.sum(
                Expense.amount
            ).label("total"),
        )
        .filter(
            Expense.user_id == user_id,

            extract(
                "year",
                Expense.date,
            ) == selected_year,

            extract(
                "month",
                Expense.date,
            ) == selected_month,
        )
        .group_by(
            Expense.category,
        )
        .order_by(
            func.sum(
                Expense.amount
            ).desc(),
        )
        .all()
    )

    return [
        {
            "category": category,
            "total": float(
                total or 0
            ),
        }
        for category, total in results
    ]


# ==========================================================
# DAILY TREND
# ==========================================================

def get_daily_trend(
    db: Session,
    user_id: int,
    start_date: date,
    end_date: date,
):
    """
    Returns income and expenses day-by-day.

    IMPORTANT:
    Income.date and Expense.date are DateTime columns.

    Therefore we explicitly CAST the datetime to DATE
    before grouping.

    This prevents:

        2026-08-28 10:30:00

    from failing to match:

        2026-08-28
    """

    # ======================================================
    # INCOME
    # ======================================================

    income_results = (
        db.query(
            cast(
                Income.date,
                Date,
            ).label("transaction_date"),

            func.sum(
                Income.amount
            ).label("total"),
        )
        .filter(
            Income.user_id == user_id,

            cast(
                Income.date,
                Date,
            ) >= start_date,

            cast(
                Income.date,
                Date,
            ) <= end_date,
        )
        .group_by(
            cast(
                Income.date,
                Date,
            ),
        )
        .all()
    )


    # ======================================================
    # EXPENSES
    # ======================================================

    expense_results = (
        db.query(
            cast(
                Expense.date,
                Date,
            ).label("transaction_date"),

            func.sum(
                Expense.amount
            ).label("total"),
        )
        .filter(
            Expense.user_id == user_id,

            cast(
                Expense.date,
                Date,
            ) >= start_date,

            cast(
                Expense.date,
                Date,
            ) <= end_date,
        )
        .group_by(
            cast(
                Expense.date,
                Date,
            ),
        )
        .all()
    )


    # ======================================================
    # INCOME MAP
    # ======================================================

    income_map = {
        transaction_date: float(
            total or 0
        )
        for transaction_date, total
        in income_results
    }


    # ======================================================
    # EXPENSE MAP
    # ======================================================

    expense_map = {
        transaction_date: float(
            total or 0
        )
        for transaction_date, total
        in expense_results
    }


    # ======================================================
    # BUILD EVERY DAY
    # ======================================================

    result = []

    current_date = start_date

    while current_date <= end_date:

        result.append(
            {
                "date":
                    current_date.isoformat(),

                "label":
                    current_date.strftime(
                        "%b %d"
                    ),

                "month":
                    current_date.strftime(
                        "%b %d"
                    ),

                "total_income":
                    round(
                        income_map.get(
                            current_date,
                            0,
                        ),
                        2,
                    ),

                "total_expenses":
                    round(
                        expense_map.get(
                            current_date,
                            0,
                        ),
                        2,
                    ),
            }
        )

        current_date += timedelta(
            days=1
        )


    return result


# ==========================================================
# MONTHLY TREND
# ==========================================================

def get_monthly_trend(
    db: Session,
    user_id: int,
    months: int = 6,
    month: int | None = None,
    year: int | None = None,
):
    """
    Returns monthly income/expense trend.

    Example:

        Mar
        Apr
        May
        Jun
        Jul
        Aug
    """

    selected_month, selected_year = (
        _get_selected_period(
            month,
            year,
        )
    )

    months = max(
        1,
        min(
            int(months),
            24,
        ),
    )


    # ======================================================
    # INCOME
    # ======================================================

    income_results = (
        db.query(
            extract(
                "year",
                Income.date,
            ).label("year"),

            extract(
                "month",
                Income.date,
            ).label("month"),

            func.sum(
                Income.amount
            ).label("total"),
        )
        .filter(
            Income.user_id == user_id,
        )
        .group_by(
            extract(
                "year",
                Income.date,
            ),

            extract(
                "month",
                Income.date,
            ),
        )
        .all()
    )


    # ======================================================
    # EXPENSES
    # ======================================================

    expense_results = (
        db.query(
            extract(
                "year",
                Expense.date,
            ).label("year"),

            extract(
                "month",
                Expense.date,
            ).label("month"),

            func.sum(
                Expense.amount
            ).label("total"),
        )
        .filter(
            Expense.user_id == user_id,
        )
        .group_by(
            extract(
                "year",
                Expense.date,
            ),

            extract(
                "month",
                Expense.date,
            ),
        )
        .all()
    )


    # ======================================================
    # INCOME MAP
    # ======================================================

    income_map = {
        (
            int(result_year),
            int(result_month),
        ): float(
            total or 0
        )

        for (
            result_year,
            result_month,
            total
        ) in income_results
    }


    # ======================================================
    # EXPENSE MAP
    # ======================================================

    expense_map = {
        (
            int(result_year),
            int(result_month),
        ): float(
            total or 0
        )

        for (
            result_year,
            result_month,
            total
        ) in expense_results
    }


    # ======================================================
    # BUILD MONTHS
    # ======================================================

    result = []

    current_year = selected_year
    current_month = selected_month


    for _ in range(months):

        key = (
            current_year,
            current_month,
        )


        result.append(
            {
                "month":
                    f"{current_year:04d}-"
                    f"{current_month:02d}",

                "label":
                    MONTH_NAMES[
                        current_month - 1
                    ],

                "short_label":
                    MONTH_NAMES[
                        current_month - 1
                    ][:3],

                "total_income":
                    round(
                        income_map.get(
                            key,
                            0,
                        ),
                        2,
                    ),

                "total_expenses":
                    round(
                        expense_map.get(
                            key,
                            0,
                        ),
                        2,
                    ),
            }
        )


        # Move backwards one month

        current_month -= 1


        if current_month == 0:

            current_month = 12

            current_year -= 1


    # ======================================================
    # RETURN CHRONOLOGICAL ORDER
    # ======================================================

    result.reverse()

    return result


# ==========================================================
# UNIFIED TREND
# ==========================================================

def get_trend(
    db: Session,
    user_id: int,
    granularity: str = "day",
    months: int = 1,
    month: int | None = None,
    year: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    """
    Unified analytics trend.

    Supports:

    1. Current/selected month → daily
    2. Multiple months → monthly
    3. Custom date range → daily
    """

    granularity = (
        granularity or "day"
    ).strip().lower()


    # ======================================================
    # CUSTOM RANGE
    # ======================================================

    if (
        start_date is not None
        and end_date is not None
    ):

        return get_daily_trend(
            db=db,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
        )


    # ======================================================
    # DAILY
    # ======================================================

    if granularity == "day":

        selected_month, selected_year = (
            _get_selected_period(
                month,
                year,
            )
        )


        start_date, end_date = (
            _get_month_date_range(
                selected_month,
                selected_year,
            )
        )


        return get_daily_trend(
            db=db,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
        )


    # ======================================================
    # MONTHLY
    # ======================================================

    if granularity == "month":

        return get_monthly_trend(
            db=db,
            user_id=user_id,
            months=months,
            month=month,
            year=year,
        )


    # ======================================================
    # INVALID
    # ======================================================

    raise ValueError(
        "Invalid trend granularity. "
        "Use 'day' or 'month'."
    )


# ==========================================================
# SAVINGS PROGRESS
# ==========================================================

def get_savings_progress(
    db: Session,
    user_id: int,
    month: int | None = None,
    year: int | None = None,
):

    selected_month, selected_year = (
        _get_selected_period(
            month,
            year,
        )
    )


    selected_month_index = (
        selected_year * 12
        + selected_month
    )


    goals = (
        db.query(
            SavingsGoal
        )
        .filter(
            SavingsGoal.user_id == user_id,
        )
        .order_by(
            SavingsGoal.created_at.desc(),
        )
        .all()
    )


    result = []


    for goal in goals:

        # ==================================================
        # CREATED MONTH
        # ==================================================

        if goal.created_at is not None:

            created_month_index = (
                goal.created_at.year * 12
                + goal.created_at.month
            )

        else:

            created_month_index = (
                selected_month_index
            )


        # ==================================================
        # TARGET MONTH
        # ==================================================

        target_month_index = None


        if goal.target_date is not None:

            target_month_index = (
                goal.target_date.year * 12
                + goal.target_date.month
            )


        # ==================================================
        # NOT YET CREATED
        # ==================================================

        if (
            selected_month_index
            < created_month_index
        ):

            continue


        # ==================================================
        # ALREADY PASSED TARGET
        # ==================================================

        if (
            target_month_index is not None
            and
            selected_month_index
            > target_month_index
        ):

            continue


        # ==================================================
        # AMOUNTS
        # ==================================================

        target_amount = float(
            goal.target_amount or 0
        )

        current_amount = float(
            goal.current_amount or 0
        )


        # ==================================================
        # PERCENTAGE
        # ==================================================

        if target_amount > 0:

            percentage = (
                current_amount
                / target_amount
            ) * 100

        else:

            percentage = 0


        percentage = min(
            percentage,
            100,
        )


        result.append(
            {
                "id":
                    goal.id,

                "title":
                    goal.title,

                "target_amount":
                    target_amount,

                "current_amount":
                    current_amount,

                "percentage":
                    round(
                        percentage,
                        2,
                    ),

                "status":
                    goal.status,
            }
        )


    return result


# ==========================================================
# ACCOUNT BALANCE
# ==========================================================

def get_monthly_account_balance(
    db: Session,
    user_id: int,
    month: int,
    year: int,
):

    selected_income = (
        db.query(
            func.sum(
                Income.amount
            ),
        )
        .filter(
            Income.user_id == user_id,

            Income.bank_account_id.isnot(None),

            extract(
                "year",
                Income.date,
            ) == year,

            extract(
                "month",
                Income.date,
            ) == month,
        )
        .scalar()
    )


    selected_expenses = (
        db.query(
            func.sum(
                Expense.amount
            ),
        )
        .filter(
            Expense.user_id == user_id,

            Expense.bank_account_id.isnot(None),

            extract(
                "year",
                Expense.date,
            ) == year,

            extract(
                "month",
                Expense.date,
            ) == month,
        )
        .scalar()
    )


    selected_income = float(
        selected_income or 0
    )

    selected_expenses = float(
        selected_expenses or 0
    )


    if (
        selected_income == 0
        and selected_expenses == 0
    ):

        return 0.0


    current_balance = (
        db.query(
            func.sum(
                BankAccount.balance
            ),
        )
        .filter(
            BankAccount.user_id == user_id,
        )
        .scalar()
    )


    current_balance = float(
        current_balance or 0
    )


    selected_index = (
        year * 12
        + month
    )


    future_income = (
        db.query(
            func.sum(
                Income.amount
            ),
        )
        .filter(
            Income.user_id == user_id,

            Income.bank_account_id.isnot(None),

            (
                extract(
                    "year",
                    Income.date,
                ) * 12
                +
                extract(
                    "month",
                    Income.date,
                )
            ) > selected_index,
        )
        .scalar()
    )


    future_expenses = (
        db.query(
            func.sum(
                Expense.amount
            ),
        )
        .filter(
            Expense.user_id == user_id,

            Expense.bank_account_id.isnot(None),

            (
                extract(
                    "year",
                    Expense.date,
                ) * 12
                +
                extract(
                    "month",
                    Expense.date,
                )
            ) > selected_index,
        )
        .scalar()
    )


    future_income = float(
        future_income or 0
    )

    future_expenses = float(
        future_expenses or 0
    )


    historical_balance = (
        current_balance
        - future_income
        + future_expenses
    )


    return round(
        max(
            historical_balance,
            0,
        ),
        2,
    )


# ==========================================================
# ANALYTICS SUMMARY
# ==========================================================

def get_analytics_summary(
    db: Session,
    user_id: int,
    month: int | None = None,
    year: int | None = None,
):

    selected_month, selected_year = (
        _get_selected_period(
            month,
            year,
        )
    )


    # ======================================================
    # INCOME
    # ======================================================

    total_income = (
        db.query(
            func.sum(
                Income.amount
            ),
        )
        .filter(
            Income.user_id == user_id,

            extract(
                "year",
                Income.date,
            ) == selected_year,

            extract(
                "month",
                Income.date,
            ) == selected_month,
        )
        .scalar()
    )


    total_income = float(
        total_income or 0
    )


    # ======================================================
    # EXPENSES
    # ======================================================

    total_expenses = (
        db.query(
            func.sum(
                Expense.amount
            ),
        )
        .filter(
            Expense.user_id == user_id,

            extract(
                "year",
                Expense.date,
            ) == selected_year,

            extract(
                "month",
                Expense.date,
            ) == selected_month,
        )
        .scalar()
    )


    total_expenses = float(
        total_expenses or 0
    )


    # ======================================================
    # NET BALANCE
    # ======================================================

    net_balance = (
        total_income
        - total_expenses
    )


    # ======================================================
    # SAVINGS RATE
    # ======================================================

    if total_income > 0:

        savings_rate = (
            net_balance
            / total_income
        ) * 100

    else:

        savings_rate = 0


    # ======================================================
    # ACCOUNT BALANCE
    # ======================================================

    account_balance = (
        get_monthly_account_balance(
            db=db,
            user_id=user_id,
            month=selected_month,
            year=selected_year,
        )
    )


    return {
        "total_income":
            round(
                total_income,
                2,
            ),

        "total_expenses":
            round(
                total_expenses,
                2,
            ),

        "net_balance":
            round(
                net_balance,
                2,
            ),

        "savings_rate":
            round(
                savings_rate,
                2,
            ),

        "account_balance":
            round(
                account_balance,
                2,
            ),
    }