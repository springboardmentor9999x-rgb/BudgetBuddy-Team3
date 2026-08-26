from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.models.expense import Expense
from app.models.income import Income
from app.models.savings_goal import SavingsGoal


# ==========================================================
# HELPER — SELECTED PERIOD
# ==========================================================

def _get_selected_period(
    month: int | None = None,
    year: int | None = None
):
    """
    Returns the selected month and year.

    If month/year are not supplied, the current
    system month/year are used.
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
# SPENDING BY CATEGORY
# ==========================================================

def get_spending_by_category(
    db: Session,
    user_id: int,
    month: int | None = None,
    year: int | None = None
):
    """
    Returns total spending grouped by category
    for the selected month/year.

    If month/year are not provided, the current
    month/year are used.
    """

    selected_month, selected_year = _get_selected_period(
        month,
        year
    )

    results = (
        db.query(
            Expense.category.label("category"),
            func.sum(Expense.amount).label("total")
        )
        .filter(
            Expense.user_id == user_id,

            extract(
                "year",
                Expense.date
            ) == selected_year,

            extract(
                "month",
                Expense.date
            ) == selected_month
        )
        .group_by(
            Expense.category
        )
        .order_by(
            func.sum(
                Expense.amount
            ).desc()
        )
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
    Returns income and expense totals for the
    requested number of recent months.

    Months without transactions are included
    with zero values.
    """

    now = datetime.now()

    # ------------------------------------------------------
    # INCOME
    # ------------------------------------------------------

    income_results = (
        db.query(
            extract(
                "year",
                Income.date
            ).label("year"),

            extract(
                "month",
                Income.date
            ).label("month"),

            func.sum(
                Income.amount
            ).label("total")
        )
        .filter(
            Income.user_id == user_id
        )
        .group_by(
            extract(
                "year",
                Income.date
            ),
            extract(
                "month",
                Income.date
            )
        )
        .all()
    )

    # ------------------------------------------------------
    # EXPENSES
    # ------------------------------------------------------

    expense_results = (
        db.query(
            extract(
                "year",
                Expense.date
            ).label("year"),

            extract(
                "month",
                Expense.date
            ).label("month"),

            func.sum(
                Expense.amount
            ).label("total")
        )
        .filter(
            Expense.user_id == user_id
        )
        .group_by(
            extract(
                "year",
                Expense.date
            ),
            extract(
                "month",
                Expense.date
            )
        )
        .all()
    )

    # ------------------------------------------------------
    # CREATE LOOKUP MAPS
    # ------------------------------------------------------

    income_map = {
        (
            int(year),
            int(month)
        ): float(total or 0)

        for year, month, total
        in income_results
    }

    expense_map = {
        (
            int(year),
            int(month)
        ): float(total or 0)

        for year, month, total
        in expense_results
    }

    # ------------------------------------------------------
    # BUILD MONTH LIST
    # ------------------------------------------------------

    result = []

    year = now.year
    month = now.month

    for _ in range(months):

        key = (
            year,
            month
        )

        result.append(
            {
                "month": (
                    f"{year:04d}-{month:02d}"
                ),

                "total_income":
                    income_map.get(
                        key,
                        0
                    ),

                "total_expenses":
                    expense_map.get(
                        key,
                        0
                    )
            }
        )

        # Move backward one month
        month -= 1

        if month == 0:
            month = 12
            year -= 1

    # Oldest -> newest
    result.reverse()

    return result


# ==========================================================
# SAVINGS PROGRESS
# ==========================================================

def get_savings_progress(
    db: Session,
    user_id: int,
    month: int | None = None,
    year: int | None = None
):
    """
    Returns savings goals that are active during
    the selected month/year.

    A savings goal is shown when:

        created month <= selected month <= target month

    Example:

        Created: June 2026
        Target:  August 2026

        June    -> shown
        July    -> shown
        August  -> shown
        September -> hidden

    If target_date is not provided, the goal remains
    visible from its creation month onward.
    """

    selected_month, selected_year = _get_selected_period(
        month,
        year
    )

    # ------------------------------------------------------
    # CREATE A MONTH INDEX
    # ------------------------------------------------------
    #
    # Example:
    #
    # August 2026 -> 2026 * 12 + 8
    #
    # This makes comparing months across years easy.
    #

    selected_month_index = (
        selected_year * 12
        + selected_month
    )

    # ------------------------------------------------------
    # GET USER GOALS
    # ------------------------------------------------------

    goals = (
        db.query(
            SavingsGoal
        )
        .filter(
            SavingsGoal.user_id == user_id
        )
        .order_by(
            SavingsGoal.created_at.desc()
        )
        .all()
    )

    result = []

    for goal in goals:

        # --------------------------------------------------
        # CREATED MONTH
        # --------------------------------------------------

        if goal.created_at is not None:

            created_month_index = (
                goal.created_at.year * 12
                + goal.created_at.month
            )

        else:

            # If somehow created_at is missing,
            # allow the goal to remain visible.
            created_month_index = selected_month_index

        # --------------------------------------------------
        # TARGET MONTH
        # --------------------------------------------------

        target_month_index = None

        if goal.target_date is not None:

            target_month_index = (
                goal.target_date.year * 12
                + goal.target_date.month
            )

        # --------------------------------------------------
        # CHECK WHETHER GOAL BELONGS TO SELECTED MONTH
        # --------------------------------------------------

        # Goal cannot appear before it was created.

        if selected_month_index < created_month_index:
            continue

        # If target date exists, the goal cannot appear
        # after its target month.

        if (
            target_month_index is not None
            and selected_month_index > target_month_index
        ):
            continue

        # --------------------------------------------------
        # AMOUNTS
        # --------------------------------------------------

        target_amount = float(
            goal.target_amount or 0
        )

        current_amount = float(
            goal.current_amount or 0
        )

        # --------------------------------------------------
        # CALCULATE PERCENTAGE
        # --------------------------------------------------

        if target_amount > 0:

            percentage = (
                current_amount
                / target_amount
            ) * 100

        else:

            percentage = 0

        # --------------------------------------------------
        # LIMIT TO 100%
        # --------------------------------------------------

        percentage = min(
            percentage,
            100
        )

        # --------------------------------------------------
        # RESPONSE
        # --------------------------------------------------

        result.append(
            {
                "id": goal.id,

                "title": goal.title,

                "target_amount":
                    target_amount,

                "current_amount":
                    current_amount,

                "percentage":
                    round(
                        percentage,
                        2
                    ),

                "status":
                    goal.status
            }
        )

    return result


# ==========================================================
# ANALYTICS SUMMARY
# ==========================================================

def get_analytics_summary(
    db: Session,
    user_id: int,
    month: int | None = None,
    year: int | None = None
):
    """
    Returns:

    - Total income
    - Total expenses
    - Net balance
    - Savings rate

    for the selected month/year.

    If month/year are not provided,
    the current month/year are used.
    """

    selected_month, selected_year = _get_selected_period(
        month,
        year
    )

    # ------------------------------------------------------
    # TOTAL INCOME
    # ------------------------------------------------------

    total_income = (
        db.query(
            func.sum(
                Income.amount
            )
        )
        .filter(
            Income.user_id == user_id,

            extract(
                "year",
                Income.date
            ) == selected_year,

            extract(
                "month",
                Income.date
            ) == selected_month
        )
        .scalar()
    )

    total_income = float(
        total_income or 0
    )

    # ------------------------------------------------------
    # TOTAL EXPENSES
    # ------------------------------------------------------

    total_expenses = (
        db.query(
            func.sum(
                Expense.amount
            )
        )
        .filter(
            Expense.user_id == user_id,

            extract(
                "year",
                Expense.date
            ) == selected_year,

            extract(
                "month",
                Expense.date
            ) == selected_month
        )
        .scalar()
    )

    total_expenses = float(
        total_expenses or 0
    )

    # ------------------------------------------------------
    # NET BALANCE
    # ------------------------------------------------------

    net_balance = (
        total_income
        - total_expenses
    )

    # ------------------------------------------------------
    # SAVINGS RATE
    # ------------------------------------------------------

    if total_income > 0:

        savings_rate = (
            net_balance
            / total_income
        ) * 100

    else:

        savings_rate = 0

    # ------------------------------------------------------
    # RESPONSE
    # ------------------------------------------------------

    return {
        "total_income":
            round(
                total_income,
                2
            ),

        "total_expenses":
            round(
                total_expenses,
                2
            ),

        "net_balance":
            round(
                net_balance,
                2
            ),

        "savings_rate":
            round(
                savings_rate,
                2
            )
    }