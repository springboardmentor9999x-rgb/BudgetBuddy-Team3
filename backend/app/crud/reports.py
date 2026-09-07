from collections import defaultdict
from calendar import monthrange
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.models.income import Income
from app.models.expense import Expense


# ==========================================================
# MONTHLY REPORT
# ==========================================================

def get_monthly_report(
    db: Session,
    user_id: int,
    month: int,
    year: int
):
    # ======================================================
    # TOTAL INCOME
    # ======================================================

    total_income = (
        db.query(func.sum(Income.amount))
        .filter(
            Income.user_id == user_id,
            extract("month", Income.date) == month,
            extract("year", Income.date) == year
        )
        .scalar()
    )

    total_income = float(total_income or 0)

    # ======================================================
    # TOTAL EXPENSES
    # ======================================================

    total_expenses = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == user_id,
            extract("month", Expense.date) == month,
            extract("year", Expense.date) == year
        )
        .scalar()
    )

    total_expenses = float(total_expenses or 0)

    # ======================================================
    # BALANCE
    # ======================================================

    balance = total_income - total_expenses

    # ======================================================
    # SPENDING BY CATEGORY
    # ======================================================

    categories = (
        db.query(
            Expense.category.label("category"),
            func.sum(Expense.amount).label("total")
        )
        .filter(
            Expense.user_id == user_id,
            extract("month", Expense.date) == month,
            extract("year", Expense.date) == year
        )
        .group_by(Expense.category)
        .order_by(
            func.sum(Expense.amount).desc()
        )
        .all()
    )

    spending_by_category = [
        {
            "category": category,
            "total": float(total or 0)
        }
        for category, total in categories
    ]

    # ======================================================
    # INCOME TRANSACTIONS
    # ======================================================

    income_transactions = (
        db.query(Income)
        .filter(
            Income.user_id == user_id,
            extract("month", Income.date) == month,
            extract("year", Income.date) == year
        )
        .all()
    )

    # ======================================================
    # EXPENSE TRANSACTIONS
    # ======================================================

    expense_transactions = (
        db.query(Expense)
        .filter(
            Expense.user_id == user_id,
            extract("month", Expense.date) == month,
            extract("year", Expense.date) == year
        )
        .all()
    )

    # ======================================================
    # RECENT TRANSACTIONS
    # ======================================================

    transactions = []

    # ------------------------------------------------------
    # INCOME
    # ------------------------------------------------------

    for income in income_transactions:

        transactions.append(
            {
                "date": income.date,
                "type": "Income",
                "category": "Income",
                "amount": float(
                    income.amount or 0
                )
            }
        )

    # ------------------------------------------------------
    # EXPENSE
    # ------------------------------------------------------

    for expense in expense_transactions:

        transactions.append(
            {
                "date": expense.date,
                "type": "Expense",
                "category": expense.category,
                "amount": float(
                    expense.amount or 0
                )
            }
        )

    # ------------------------------------------------------
    # NEWEST FIRST
    # ------------------------------------------------------

    transactions.sort(
        key=lambda transaction: transaction["date"],
        reverse=True
    )

    # ======================================================
    # CHART 1 — FINANCIAL OVERVIEW
    # ======================================================

    financial_overview = {
        "income": total_income,
        "expenses": total_expenses,
        "balance": balance
    }

    # ======================================================
    # CHART 3 — TRANSACTION COUNT
    # ======================================================

    transaction_counts = {
        "income": len(income_transactions),
        "expense": len(expense_transactions)
    }

    # ======================================================
    # CHART 4 — DAILY EXPENSE TREND
    # ======================================================

    daily_expenses = defaultdict(float)

    for expense in expense_transactions:

        expense_date = expense.date

        if expense_date is None:
            continue

        day = expense_date.day

        daily_expenses[day] += float(
            expense.amount or 0
        )

    daily_expense_trend = [
        {
            "day": day,
            "amount": round(
                daily_expenses[day],
                2
            )
        }
        for day in sorted(daily_expenses)
    ]

    # ======================================================
    # RETURN REPORT
    # ======================================================

    return {
        "month": month,
        "year": year,

        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": balance,

        "spending_by_category": spending_by_category,
        "recent_transactions": transactions,

        "financial_overview": financial_overview,

        "transaction_counts": transaction_counts,

        "daily_expense_trend": daily_expense_trend
    }


# ==========================================================
# HELPER — CONVERT VALUE TO DATE
# ==========================================================

def _to_date(value):
    """
    Convert a date/datetime/string value to a Python date.
    """

    if value is None:
        return None

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    if isinstance(value, str):
        return datetime.strptime(
            value,
            "%Y-%m-%d"
        ).date()

    raise ValueError(
        "Invalid date format. Expected YYYY-MM-DD."
    )


# ==========================================================
# HELPER — ADD MONTHS
# ==========================================================

def _add_months(
    source_date: date,
    months: int
):
    """
    Add/subtract months safely.

    Example:
        August 2026 - 5 months
        = March 2026
    """

    month_index = (
        source_date.year * 12
        + source_date.month
        - 1
        + months
    )

    year = month_index // 12
    month = month_index % 12 + 1

    return date(
        year,
        month,
        1
    )


# ==========================================================
# HELPER — BUILD MONTH RANGE
# ==========================================================

def _get_month_range(
    month: int,
    year: int,
    number_of_months: int
):
    """
    Return the start date and end date for a rolling
    month range.

    The selected month is treated as the ending month.

    Example:

        month=8
        year=2026
        number_of_months=6

    returns:

        2026-03-01
        2026-09-01

    The end date is exclusive.
    """

    selected_month =date(
            year,
            month,
            1
        )

    start_date = _add_months(
        selected_month,
        -(number_of_months - 1)
    )

    end_date = _add_months(
        selected_month,
        1
    )

    return start_date, end_date


# ==========================================================
# RANGE REPORT
# ==========================================================

def get_report_for_range(
    db: Session,
    user_id: int,
    range_type: str = "current_month",
    month: int = None,
    year: int = None,
    start_date=None,
    end_date=None
):
    """
    Generate report data for:

        current_month
        6_months
        12_months
        custom

    IMPORTANT:
    All queries are restricted to the authenticated user's
    user_id.
    """

    # ======================================================
    # VALIDATE MONTH / YEAR
    # ======================================================

    if month is None or year is None:

        raise ValueError(
            "month and year are required."
        )

    month = int(month)
    year = int(year)

    # ======================================================
    # NORMALIZE RANGE
    # ======================================================

    range_type = (
        str(range_type or "current_month")
        .strip()
        .lower()
    )

    # Support a few safe aliases.
    range_aliases = {
        "current": "current_month",
        "month": "current_month",
        "current-month": "current_month",

        "6": "6_months",
        "6_month": "6_months",
        "last_6_months": "6_months",
        "last-6-months": "6_months",

        "12": "12_months",
        "12_month": "12_months",
        "last_12_months": "12_months",
        "last-12-months": "12_months",

        "custom-range": "custom",
        "custom_range": "custom",
    }

    range_type = range_aliases.get(
        range_type,
        range_type
    )

    # ======================================================
    # DETERMINE DATE RANGE
    # ======================================================

    if range_type == "current_month":

        report_start = date(
            year,
            month,
            1
        )

        report_end = _add_months(
            report_start,
            1
        )

    elif range_type == "6_months":

        report_start, report_end = (
            _get_month_range(
                month,
                year,
                6
            )
        )

    elif range_type == "12_months":

        report_start, report_end = (
            _get_month_range(
                month,
                year,
                12
            )
        )

    elif range_type == "custom":

        report_start = _to_date(
            start_date
        )

        report_end_inclusive = _to_date(
            end_date
        )

        if (
            report_start is None
            or report_end_inclusive is None
        ):
            raise ValueError(
                "start_date and end_date are required for custom range."
            )

        if report_start > report_end_inclusive:
            raise ValueError(
                "start_date cannot be after end_date."
            )

        # End is exclusive for datetime-safe queries.
        report_end = (
            report_end_inclusive
            + timedelta(days=1)
        )

    else:

        raise ValueError(
            "Unsupported report range. "
            "Use current_month, 6_months, "
            "12_months, or custom."
        )

    # ======================================================
    # FETCH INCOME
    # ======================================================

    income_transactions = (
        db.query(Income)
        .filter(
            Income.user_id == user_id,
            Income.date >= report_start,
            Income.date < report_end
        )
        .order_by(
            Income.date.desc()
        )
        .all()
    )

    # ======================================================
    # FETCH EXPENSES
    # ======================================================

    expense_transactions = (
        db.query(Expense)
        .filter(
            Expense.user_id == user_id,
            Expense.date >= report_start,
            Expense.date < report_end
        )
        .order_by(
            Expense.date.desc()
        )
        .all()
    )

    # ======================================================
    # TOTAL INCOME
    # ======================================================

    total_income = sum(
        float(
            income.amount or 0
        )
        for income in income_transactions
    )

    # ======================================================
    # TOTAL EXPENSES
    # ======================================================

    total_expenses = sum(
        float(
            expense.amount or 0
        )
        for expense in expense_transactions
    )

    # ======================================================
    # BALANCE
    # ======================================================

    balance = (
        total_income
        - total_expenses
    )

    # ======================================================
    # SPENDING BY CATEGORY
    # ======================================================

    category_totals = defaultdict(float)

    for expense in expense_transactions:

        category = (
            expense.category
            or "Other"
        )

        category_totals[category] += float(
            expense.amount or 0
        )

    spending_by_category = [
        {
            "category": category,
            "total": round(
                total,
                2
            )
        }
        for category, total
        in sorted(
            category_totals.items(),
            key=lambda item: item[1],
            reverse=True
        )
    ]

    # ======================================================
    # ALL TRANSACTIONS
    # ======================================================

    transactions = []

    for income in income_transactions:

        transactions.append(
            {
                "date": income.date,
                "type": "Income",
                "category": "Income",
                "amount": float(
                    income.amount or 0
                )
            }
        )

    for expense in expense_transactions:

        transactions.append(
            {
                "date": expense.date,
                "type": "Expense",
                "category": (
                    expense.category
                    or "Other"
                ),
                "amount": float(
                    expense.amount or 0
                )
            }
        )

    transactions.sort(
        key=lambda transaction: (
            transaction["date"]
            or datetime.min
        ),
        reverse=True
    )

    # ======================================================
    # MONTHLY BREAKDOWN
    # ======================================================

    monthly_data = defaultdict(
        lambda: {
            "income": 0.0,
            "expenses": 0.0
        }
    )

    for income in income_transactions:

        if income.date is None:
            continue

        income_date = income.date

        key = (
            income_date.year,
            income_date.month
        )

        monthly_data[key]["income"] += float(
            income.amount or 0
        )

    for expense in expense_transactions:

        if expense.date is None:
            continue

        expense_date = expense.date

        key = (
            expense_date.year,
            expense_date.month
        )

        monthly_data[key]["expenses"] += float(
            expense.amount or 0
        )

    # ======================================================
    # BUILD ORDERED MONTHLY SUMMARY
    # ======================================================

    monthly_summary = []

    cursor = date(
        report_start.year,
        report_start.month,
        1
    )

    last_month = date(
        (report_end - timedelta(days=1)).year,
        (report_end - timedelta(days=1)).month,
        1
    )

    while cursor <= last_month:

        key = (
            cursor.year,
            cursor.month
        )

        month_income = round(
            monthly_data[key]["income"],
            2
        )

        month_expenses = round(
            monthly_data[key]["expenses"],
            2
        )

        monthly_summary.append(
            {
                "month": cursor.month,
                "year": cursor.year,
                "label": cursor.strftime(
                    "%B %Y"
                ),
                "income": month_income,
                "expenses": month_expenses,
                "balance": round(
                    month_income
                    - month_expenses,
                    2
                )
            }
        )

        cursor = _add_months(
            cursor,
            1
        )

    # ======================================================
    # DAILY EXPENSE TREND
    # ======================================================

    daily_expenses = defaultdict(float)

    for expense in expense_transactions:

        expense_date = expense.date

        if expense_date is None:
            continue

        # For current month, use day number.
        #
        # For longer/custom ranges, use the actual
        # date so days from different months don't
        # get merged together.

        if range_type == "current_month":

            key = expense_date.day

        else:

            key = (
                expense_date.date()
                if isinstance(
                    expense_date,
                    datetime
                )
                else expense_date
            )

        daily_expenses[key] += float(
            expense.amount or 0
        )

    daily_expense_trend = []

    for day_key in sorted(
        daily_expenses
    ):

        if range_type == "current_month":

            daily_expense_trend.append(
                {
                    "day": day_key,
                    "amount": round(
                        daily_expenses[day_key],
                        2
                    )
                }
            )

        else:

            daily_expense_trend.append(
                {
                    "date": day_key.isoformat(),
                    "amount": round(
                        daily_expenses[day_key],
                        2
                    )
                }
            )

    # ======================================================
    # TRANSACTION COUNTS
    # ======================================================

    transaction_counts = {
        "income": len(
            income_transactions
        ),
        "expense": len(
            expense_transactions
        )
    }

    # ======================================================
    # FINANCIAL OVERVIEW
    # ======================================================

    financial_overview = {
        "income": round(
            total_income,
            2
        ),
        "expenses": round(
            total_expenses,
            2
        ),
        "balance": round(
            balance,
            2
        )
    }

    # ======================================================
    # RETURN RANGE REPORT
    # ======================================================

    return {
        "range": range_type,

        "start_date": report_start,
        "end_date": (
            report_end - timedelta(days=1)
        ),

        "month": month,
        "year": year,

        "total_income": round(
            total_income,
            2
        ),

        "total_expenses": round(
            total_expenses,
            2
        ),

        "balance": round(
            balance,
            2
        ),

        "financial_overview":
            financial_overview,

        "spending_by_category":
            spending_by_category,

        "transaction_counts":
            transaction_counts,

        "daily_expense_trend":
            daily_expense_trend,

        "monthly_summary":
            monthly_summary,

        "recent_transactions":
            transactions,

        "income_transactions":
            [
                {
                    "date": income.date,
                    "amount": float(
                        income.amount or 0
                    )
                }
                for income
                in income_transactions
            ],

        "expense_transactions":
            [
                {
                    "date": expense.date,
                    "category": (
                        expense.category
                        or "Other"
                    ),
                    "amount": float(
                        expense.amount or 0
                    )
                }
                for expense
                in expense_transactions
            ]
    }