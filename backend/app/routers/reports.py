from io import BytesIO
from pathlib import Path
from datetime import datetime, date

from fastapi import (
    APIRouter,
    Depends,
    Query,
    HTTPException,
)

from fastapi.responses import StreamingResponse

from sqlalchemy.orm import Session

from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm

from openpyxl import Workbook
from openpyxl.styles import (
    Font,
    PatternFill,
    Alignment,
    Border,
    Side,
)

from app.database import get_db

from app.core.deps import (
    get_current_user,
    require_user,
)

from app.models.user import User

from app.crud import reports as reports_crud
from app.schemas.reports import MonthlyReportOut


# ==========================================================
# ROUTER
# ==========================================================

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


# ==========================================================
# FONT CONFIGURATION
# ==========================================================

BASE_DIR = Path(__file__).resolve().parents[1]

FONT_DIR = BASE_DIR / "fonts"

REGULAR_FONT_PATH = FONT_DIR / "NotoSans-Regular.ttf"
BOLD_FONT_PATH = FONT_DIR / "NotoSans-Bold.ttf"


if not REGULAR_FONT_PATH.exists():
    raise FileNotFoundError(
        f"NotoSans-Regular.ttf not found at: {REGULAR_FONT_PATH}"
    )

if not BOLD_FONT_PATH.exists():
    raise FileNotFoundError(
        f"NotoSans-Bold.ttf not found at: {BOLD_FONT_PATH}"
    )


pdfmetrics.registerFont(
    TTFont(
        "NotoSans",
        str(REGULAR_FONT_PATH),
    )
)

pdfmetrics.registerFont(
    TTFont(
        "NotoSans-Bold",
        str(BOLD_FONT_PATH),
    )
)


# ==========================================================
# PAGE CONFIGURATION
# ==========================================================

PAGE_WIDTH, PAGE_HEIGHT = A4

LEFT_MARGIN = 18 * mm
RIGHT_MARGIN = 18 * mm
TOP_MARGIN = 20 * mm
BOTTOM_MARGIN = 18 * mm


# ==========================================================
# COLORS
# ==========================================================

PRIMARY_COLOR = colors.HexColor("#173B5C")
SECONDARY_COLOR = colors.HexColor("#2563EB")

LIGHT_BLUE = colors.HexColor("#EEF5FC")
LIGHT_GREEN = colors.HexColor("#EAF9F2")
LIGHT_RED = colors.HexColor("#FDF0F0")
LIGHT_GRAY = colors.HexColor("#F5F7FA")

BORDER_COLOR = colors.HexColor("#D5DEE8")

TEXT_COLOR = colors.HexColor("#173B5C")
MUTED_COLOR = colors.HexColor("#64748B")

SUCCESS_COLOR = colors.HexColor("#16845B")
DANGER_COLOR = colors.HexColor("#C24141")

ORANGE_COLOR = colors.HexColor("#F59E0B")
PURPLE_COLOR = colors.HexColor("#7C3AED")


# ==========================================================
# ACCESS CONTROL
# ==========================================================

def get_current_month_year():
    today = date.today()
    return today.month, today.year


def validate_report_access(
    current_user: User,
    month: int,
    year: int,
):
    current_month, current_year = get_current_month_year()

    if current_user.role == "user":

        if (
            month != current_month
            or year != current_year
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "Basic users can access reports "
                    "for the current month only. "
                    "Upgrade to Premium to access "
                    "historical reports."
                ),
            )

    elif current_user.role in (
        "premium",
        "admin",
    ):
        pass

    else:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to reports.",
        )


def get_report_period(
    current_user: User,
    month: int | None,
    year: int | None,
):
    current_month, current_year = get_current_month_year()

    if current_user.role == "user":
        return current_month, current_year

    if current_user.role in (
        "premium",
        "admin",
    ):

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

        return resolved_month, resolved_year

    raise HTTPException(
        status_code=403,
        detail="You do not have access to reports.",
    )


def require_export_access(
    current_user: User,
):
    """
    PDF and Excel exports are Premium/Admin features.
    """

    if current_user.role not in (
        "premium",
        "admin",
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Report export is available only "
                "for Premium and Admin users. "
                "Upgrade to Premium to export reports."
            ),
        )


# ==========================================================
# RANGE VALIDATION
# ==========================================================

def normalize_range_type(
    range_type: str | None,
):
    value = str(
        range_type or "current_month"
    ).strip().lower()

    aliases = {
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

    return aliases.get(
        value,
        value,
    )


def validate_range_type(
    range_type: str,
):
    allowed = {
        "current_month",
        "6_months",
        "12_months",
        "custom",
    }

    if range_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid report range. "
                "Use current_month, 6_months, "
                "12_months, or custom."
            ),
        )


def resolve_export_report(
    db: Session,
    current_user: User,
    month: int | None,
    year: int | None,
    range_type: str | None,
    start_date: str | None,
    end_date: str | None,
):
    """
    Resolve and generate the requested export report.

    Premium/Admin:
        current_month
        6_months
        12_months
        custom

    Basic:
        Export is blocked before this function.
    """

    resolved_month, resolved_year = (
        get_report_period(
            current_user=current_user,
            month=month,
            year=year,
        )
    )

    normalized_range = normalize_range_type(
        range_type
    )

    validate_range_type(
        normalized_range
    )

    if normalized_range == "custom":

        if not start_date or not end_date:
            raise HTTPException(
                status_code=400,
                detail=(
                    "start_date and end_date are "
                    "required for custom reports."
                ),
            )

    try:

        report = reports_crud.get_report_for_range(
            db=db,
            user_id=current_user.id,
            range_type=normalized_range,
            month=resolved_month,
            year=resolved_year,
            start_date=start_date,
            end_date=end_date,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    return (
        report,
        normalized_range,
        resolved_month,
        resolved_year,
    )


# ==========================================================
# HELPER — CURRENCY
# ==========================================================

def format_currency(value):
    return f"₹{float(value or 0):,.2f}"


# ==========================================================
# HELPER — MONTH NAME
# ==========================================================

def get_month_name(month):

    months = [
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

    return months[month - 1]


# ==========================================================
# HELPER — DATE FORMAT
# ==========================================================

def format_transaction_date(value):

    if value is None:
        return ""

    if isinstance(value, datetime):
        return value.strftime(
            "%d %b %Y, %I:%M %p"
        )

    if isinstance(value, date):
        return value.strftime(
            "%d %b %Y"
        )

    return str(value)


def format_pdf_transaction_date(value):

    if value is None:
        return [""]

    if isinstance(value, datetime):

        return [
            value.strftime("%d %b %Y"),
            value.strftime("%I:%M %p"),
        ]

    if isinstance(value, date):

        return [
            value.strftime("%d %b %Y"),
        ]

    text = str(value)

    try:

        parsed = datetime.fromisoformat(
            text.replace("Z", "")
        )

        return [
            parsed.strftime("%d %b %Y"),
            parsed.strftime("%I:%M %p"),
        ]

    except ValueError:

        return [text]


# ==========================================================
# HELPER — REPORT PERIOD LABEL
# ==========================================================

def get_report_period_label(
    report,
    range_type,
):

    start = report.get(
        "start_date"
    )

    end = report.get(
        "end_date"
    )

    # ------------------------------------------------------
    # Handle date/datetime values
    # ------------------------------------------------------

    if isinstance(start, datetime):
        start = start.date()

    if isinstance(end, datetime):
        end = end.date()

    # ------------------------------------------------------
    # Handle ISO date strings safely
    # ------------------------------------------------------

    if isinstance(start, str):

        try:
            start = date.fromisoformat(
                start[:10]
            )
        except ValueError:
            pass

    if isinstance(end, str):

        try:
            end = date.fromisoformat(
                end[:10]
            )
        except ValueError:
            pass

    # ------------------------------------------------------
    # Current month
    # ------------------------------------------------------

    if range_type == "current_month":

        month = report.get(
            "month"
        )

        year = report.get(
            "year"
        )

        if month and year:

            return (
                f"{get_month_name(month)} "
                f"{year}"
            )

        return "Current Month"

    # ------------------------------------------------------
    # Six months
    # ------------------------------------------------------

    if range_type == "6_months":

        if isinstance(start, date) and isinstance(end, date):

            return (
                f"Last 6 Months "
                f"({start.strftime('%d %b %Y')} - "
                f"{end.strftime('%d %b %Y')})"
            )

        return "Last 6 Months"

    # ------------------------------------------------------
    # Twelve months
    # ------------------------------------------------------

    if range_type == "12_months":

        if isinstance(start, date) and isinstance(end, date):

            return (
                f"Last 12 Months "
                f"({start.strftime('%d %b %Y')} - "
                f"{end.strftime('%d %b %Y')})"
            )

        return "Last 12 Months"

    # ------------------------------------------------------
    # Custom
    # ------------------------------------------------------

    if range_type == "custom":

        if isinstance(start, date) and isinstance(end, date):

            return (
                f"{start.strftime('%d %b %Y')} - "
                f"{end.strftime('%d %b %Y')}"
            )

        return "Custom Date Range"

    return "Financial Report"


# ==========================================================
# MONTHLY REPORT API
# ==========================================================

@router.get(
    "/monthly",
    response_model=MonthlyReportOut,
)
def get_monthly_report(
    month: int | None = Query(
        None,
        ge=1,
        le=12,
    ),
    year: int | None = Query(
        None,
        ge=2000,
        le=2100,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):

    resolved_month, resolved_year = (
        get_report_period(
            current_user=current_user,
            month=month,
            year=year,
        )
    )

    if current_user.role == "user":

        validate_report_access(
            current_user=current_user,
            month=resolved_month,
            year=resolved_year,
        )

    return reports_crud.get_monthly_report(
        db,
        current_user.id,
        resolved_month,
        resolved_year,
    )


# ==========================================================
# PDF — HEADER
# ==========================================================

def draw_pdf_header(
    pdf,
    report,
    range_type,
):

    pdf.setFillColor(
        SECONDARY_COLOR
    )

    pdf.rect(
        0,
        PAGE_HEIGHT - 5 * mm,
        PAGE_WIDTH,
        5 * mm,
        fill=1,
        stroke=0,
    )

    pdf.setFont(
        "NotoSans-Bold",
        22,
    )

    pdf.setFillColor(
        PRIMARY_COLOR
    )

    pdf.drawString(
        LEFT_MARGIN,
        PAGE_HEIGHT - 22 * mm,
        "BudgetBuddy",
    )

    pdf.setFont(
        "NotoSans-Bold",
        15,
    )

    pdf.setFillColor(
        SECONDARY_COLOR
    )

    pdf.drawString(
        LEFT_MARGIN,
        PAGE_HEIGHT - 31 * mm,
        "Financial Report",
    )

    pdf.setFont(
        "NotoSans",
        10,
    )

    pdf.setFillColor(
        MUTED_COLOR
    )

    pdf.drawString(
        LEFT_MARGIN,
        PAGE_HEIGHT - 38 * mm,
        get_report_period_label(
            report,
            range_type,
        ),
    )

    pdf.setStrokeColor(
        BORDER_COLOR
    )

    pdf.line(
        LEFT_MARGIN,
        PAGE_HEIGHT - 43 * mm,
        PAGE_WIDTH - RIGHT_MARGIN,
        PAGE_HEIGHT - 43 * mm,
    )


# ==========================================================
# PDF — FOOTER
# ==========================================================

def draw_pdf_footer(pdf):

    pdf.setStrokeColor(
        BORDER_COLOR
    )

    pdf.line(
        LEFT_MARGIN,
        14 * mm,
        PAGE_WIDTH - RIGHT_MARGIN,
        14 * mm,
    )

    pdf.setFont(
        "NotoSans",
        8,
    )

    pdf.setFillColor(
        MUTED_COLOR
    )

    pdf.drawString(
        LEFT_MARGIN,
        9 * mm,
        "BudgetBuddy • Personal Finance Report",
    )

    pdf.drawRightString(
        PAGE_WIDTH - RIGHT_MARGIN,
        9 * mm,
        "Generated automatically",
    )


# ==========================================================
# PDF — SECTION TITLE
# ==========================================================

def draw_section_title(
    pdf,
    title,
    y,
):

    pdf.setFont(
        "NotoSans-Bold",
        14,
    )

    pdf.setFillColor(
        PRIMARY_COLOR
    )

    pdf.drawString(
        LEFT_MARGIN,
        y,
        title,
    )

    return y - 9 * mm


# ==========================================================
# PDF — SUMMARY CARDS
# ==========================================================

def draw_summary_cards(
    pdf,
    report,
    y,
):

    card_gap = 5 * mm

    available_width = (
        PAGE_WIDTH
        - LEFT_MARGIN
        - RIGHT_MARGIN
        - (2 * card_gap)
    )

    card_width = available_width / 3

    card_height = 28 * mm

    cards = [
        (
            "Total Income",
            report["total_income"],
            LIGHT_GREEN,
            SUCCESS_COLOR,
        ),
        (
            "Total Expenses",
            report["total_expenses"],
            LIGHT_RED,
            DANGER_COLOR,
        ),
        (
            "Net Balance",
            report["balance"],
            LIGHT_BLUE,
            SECONDARY_COLOR,
        ),
    ]

    for index, (
        label,
        value,
        background,
        accent,
    ) in enumerate(cards):

        x = (
            LEFT_MARGIN
            + index * (
                card_width + card_gap
            )
        )

        pdf.setFillColor(
            background
        )

        pdf.setStrokeColor(
            BORDER_COLOR
        )

        pdf.roundRect(
            x,
            y - card_height,
            card_width,
            card_height,
            4 * mm,
            fill=1,
            stroke=1,
        )

        pdf.setFont(
            "NotoSans-Bold",
            9,
        )

        pdf.setFillColor(
            TEXT_COLOR
        )

        pdf.drawString(
            x + 5 * mm,
            y - 9 * mm,
            label,
        )

        pdf.setFont(
            "NotoSans-Bold",
            14,
        )

        pdf.setFillColor(
            accent
        )

        pdf.drawString(
            x + 5 * mm,
            y - 19 * mm,
            format_currency(value),
        )

    return y - card_height - 12 * mm


# ==========================================================
# PDF — SPENDING TABLE
# ==========================================================

def draw_spending_table(
    pdf,
    report,
    y,
):

    y = draw_section_title(
        pdf,
        "Spending by Category",
        y,
    )

    table_x = LEFT_MARGIN

    table_width = (
        PAGE_WIDTH
        - LEFT_MARGIN
        - RIGHT_MARGIN
    )

    category_width = table_width * 0.65
    amount_width = table_width * 0.35

    row_height = 9 * mm

    pdf.setFillColor(
        PRIMARY_COLOR
    )

    pdf.setStrokeColor(
        PRIMARY_COLOR
    )

    pdf.rect(
        table_x,
        y - row_height,
        category_width,
        row_height,
        fill=1,
        stroke=0,
    )

    pdf.rect(
        table_x + category_width,
        y - row_height,
        amount_width,
        row_height,
        fill=1,
        stroke=0,
    )

    pdf.setFont(
        "NotoSans-Bold",
        9,
    )

    pdf.setFillColor(
        colors.white
    )

    pdf.drawString(
        table_x + 4 * mm,
        y - 6 * mm,
        "Category",
    )

    pdf.drawString(
        table_x + category_width + 4 * mm,
        y - 6 * mm,
        "Amount",
    )

    y -= row_height

    categories = report.get(
        "spending_by_category",
        [],
    )

    if not categories:

        pdf.setFillColor(
            LIGHT_GRAY
        )

        pdf.setStrokeColor(
            BORDER_COLOR
        )

        pdf.rect(
            table_x,
            y - row_height,
            table_width,
            row_height,
            fill=1,
            stroke=1,
        )

        pdf.setFont(
            "NotoSans",
            9,
        )

        pdf.setFillColor(
            MUTED_COLOR
        )

        pdf.drawString(
            table_x + 4 * mm,
            y - 6 * mm,
            "No spending data available.",
        )

        return y - row_height - 10 * mm

    for index, item in enumerate(categories):

        if y < BOTTOM_MARGIN + 40 * mm:

            draw_pdf_footer(pdf)

            pdf.showPage()

            draw_pdf_header(
                pdf,
                report,
                report.get(
                    "range",
                    "current_month",
                ),
            )

            y = PAGE_HEIGHT - 55 * mm

        background = (
            colors.white
            if index % 2 == 0
            else LIGHT_GRAY
        )

        pdf.setFillColor(
            background
        )

        pdf.setStrokeColor(
            BORDER_COLOR
        )

        pdf.rect(
            table_x,
            y - row_height,
            category_width,
            row_height,
            fill=1,
            stroke=1,
        )

        pdf.rect(
            table_x + category_width,
            y - row_height,
            amount_width,
            row_height,
            fill=1,
            stroke=1,
        )

        pdf.setFont(
            "NotoSans",
            9,
        )

        pdf.setFillColor(
            TEXT_COLOR
        )

        pdf.drawString(
            table_x + 4 * mm,
            y - 6 * mm,
            str(item["category"]),
        )

        pdf.drawRightString(
            table_x + table_width - 4 * mm,
            y - 6 * mm,
            format_currency(
                item["total"]
            ),
        )

        y -= row_height

    return y - 10 * mm


# ==========================================================
# PDF — TRANSACTIONS
# ==========================================================

def draw_recent_transactions(
    pdf,
    report,
    y,
):

    y = draw_section_title(
        pdf,
        "Transactions",
        y,
    )

    table_x = LEFT_MARGIN

    table_width = (
        PAGE_WIDTH
        - LEFT_MARGIN
        - RIGHT_MARGIN
    )

    widths = [
        table_width * 0.28,
        table_width * 0.17,
        table_width * 0.30,
        table_width * 0.25,
    ]

    headers = [
        "Date",
        "Type",
        "Category",
        "Amount",
    ]

    header_height = 9 * mm
    row_height = 12 * mm

    transactions = report.get(
        "recent_transactions",
        [],
    )

    def draw_table_header(current_y):

        x = table_x

        for width, header in zip(
            widths,
            headers,
        ):

            pdf.setFillColor(
                PRIMARY_COLOR
            )

            pdf.setStrokeColor(
                PRIMARY_COLOR
            )

            pdf.rect(
                x,
                current_y - header_height,
                width,
                header_height,
                fill=1,
                stroke=1,
            )

            pdf.setFont(
                "NotoSans-Bold",
                8,
            )

            pdf.setFillColor(
                colors.white
            )

            pdf.drawString(
                x + 3 * mm,
                current_y - 6 * mm,
                header,
            )

            x += width

        return current_y - header_height

    if not transactions:

        pdf.setFillColor(
            LIGHT_GRAY
        )

        pdf.setStrokeColor(
            BORDER_COLOR
        )

        pdf.rect(
            table_x,
            y - row_height,
            table_width,
            row_height,
            fill=1,
            stroke=1,
        )

        pdf.setFont(
            "NotoSans",
            9,
        )

        pdf.setFillColor(
            MUTED_COLOR
        )

        pdf.drawString(
            table_x + 4 * mm,
            y - 7 * mm,
            "No transactions available.",
        )

        return y - row_height - 10 * mm

    y = draw_table_header(y)

    for index, transaction in enumerate(
        transactions
    ):

        if y < BOTTOM_MARGIN + 30 * mm:

            draw_pdf_footer(pdf)

            pdf.showPage()

            draw_pdf_header(
                pdf,
                report,
                report.get(
                    "range",
                    "current_month",
                ),
            )

            y = PAGE_HEIGHT - 55 * mm

            y = draw_section_title(
                pdf,
                "Transactions",
                y,
            )

            y = draw_table_header(y)

        background = (
            colors.white
            if index % 2 == 0
            else LIGHT_GRAY
        )

        x = table_x

        date_lines = format_pdf_transaction_date(
            transaction.get("date")
        )

        values = [
            date_lines,
            [
                str(
                    transaction.get(
                        "type",
                        "",
                    )
                )
            ],
            [
                str(
                    transaction.get(
                        "category",
                        "",
                    )
                )
            ],
            [
                format_currency(
                    transaction.get(
                        "amount",
                        0,
                    )
                )
            ],
        ]

        for column_index, (
            width,
            lines,
        ) in enumerate(
            zip(widths, values)
        ):

            pdf.setFillColor(
                background
            )

            pdf.setStrokeColor(
                BORDER_COLOR
            )

            pdf.rect(
                x,
                y - row_height,
                width,
                row_height,
                fill=1,
                stroke=1,
            )

            pdf.setFont(
                "NotoSans",
                8,
            )

            pdf.setFillColor(
                TEXT_COLOR
            )

            if column_index == 3:

                pdf.drawRightString(
                    x + width - 3 * mm,
                    y - 7 * mm,
                    lines[0],
                )

            elif column_index == 0:

                pdf.drawString(
                    x + 3 * mm,
                    y - 5 * mm,
                    lines[0],
                )

                if len(lines) > 1:

                    pdf.drawString(
                        x + 3 * mm,
                        y - 9 * mm,
                        lines[1],
                    )

            else:

                pdf.drawString(
                    x + 3 * mm,
                    y - 7 * mm,
                    lines[0],
                )

            x += width

        y -= row_height

    return y - 10 * mm


# ==========================================================
# PDF — MONTHLY SUMMARY
# ==========================================================

def draw_monthly_summary_table(
    pdf,
    report,
    y,
):

    monthly_summary = report.get(
        "monthly_summary",
        [],
    )

    if len(monthly_summary) <= 1:
        return y

    if y < BOTTOM_MARGIN + 65 * mm:

        draw_pdf_footer(pdf)

        pdf.showPage()

        draw_pdf_header(
            pdf,
            report,
            report.get(
                "range",
                "current_month",
            ),
        )

        y = PAGE_HEIGHT - 55 * mm

    y = draw_section_title(
        pdf,
        "Monthly Breakdown",
        y,
    )

    table_x = LEFT_MARGIN

    table_width = (
        PAGE_WIDTH
        - LEFT_MARGIN
        - RIGHT_MARGIN
    )

    widths = [
        table_width * 0.25,
        table_width * 0.25,
        table_width * 0.25,
        table_width * 0.25,
    ]

    headers = [
        "Month",
        "Income",
        "Expenses",
        "Balance",
    ]

    header_height = 9 * mm
    row_height = 9 * mm

    x = table_x

    for width, header in zip(
        widths,
        headers,
    ):

        pdf.setFillColor(
            PRIMARY_COLOR
        )

        pdf.setStrokeColor(
            PRIMARY_COLOR
        )

        pdf.rect(
            x,
            y - header_height,
            width,
            header_height,
            fill=1,
            stroke=1,
        )

        pdf.setFont(
            "NotoSans-Bold",
            8,
        )

        pdf.setFillColor(
            colors.white
        )

        pdf.drawString(
            x + 3 * mm,
            y - 6 * mm,
            header,
        )

        x += width

    y -= header_height

    for index, item in enumerate(
        monthly_summary
    ):

        if y < BOTTOM_MARGIN + 25 * mm:

            draw_pdf_footer(pdf)

            pdf.showPage()

            draw_pdf_header(
                pdf,
                report,
                report.get(
                    "range",
                    "current_month",
                ),
            )

            y = PAGE_HEIGHT - 55 * mm

        background = (
            colors.white
            if index % 2 == 0
            else LIGHT_GRAY
        )

        values = [
            item["label"],
            format_currency(
                item["income"]
            ),
            format_currency(
                item["expenses"]
            ),
            format_currency(
                item["balance"]
            ),
        ]

        x = table_x

        for column_index, (
            width,
            value,
        ) in enumerate(
            zip(widths, values)
        ):

            pdf.setFillColor(
                background
            )

            pdf.setStrokeColor(
                BORDER_COLOR
            )

            pdf.rect(
                x,
                y - row_height,
                width,
                row_height,
                fill=1,
                stroke=1,
            )

            pdf.setFont(
                "NotoSans",
                8,
            )

            pdf.setFillColor(
                TEXT_COLOR
            )

            if column_index == 0:

                pdf.drawString(
                    x + 3 * mm,
                    y - 6 * mm,
                    str(value),
                )

            else:

                pdf.drawRightString(
                    x + width - 3 * mm,
                    y - 6 * mm,
                    str(value),
                )

            x += width

        y -= row_height

    return y - 10 * mm


# ==========================================================
# CHART — FINANCIAL OVERVIEW
# ==========================================================

def draw_financial_overview_chart(
    pdf,
    report,
):

    chart_x = LEFT_MARGIN
    chart_y = PAGE_HEIGHT - 65 * mm

    chart_width = (
        PAGE_WIDTH
        - LEFT_MARGIN
        - RIGHT_MARGIN
    )

    chart_height = 72 * mm

    draw_chart_title(
        pdf,
        "Financial Overview",
        chart_x,
        chart_y + 5 * mm,
    )

    pdf.setFillColor(
        colors.white
    )

    pdf.setStrokeColor(
        BORDER_COLOR
    )

    pdf.roundRect(
        chart_x,
        chart_y - chart_height,
        chart_width,
        chart_height,
        4 * mm,
        fill=1,
        stroke=1,
    )

    graph_x = chart_x + 15 * mm
    graph_y = chart_y - chart_height + 15 * mm

    graph_width = chart_width - 28 * mm
    graph_height = chart_height - 28 * mm

    values = [
        (
            "Income",
            float(
                report.get(
                    "total_income",
                    0,
                )
            ),
            SUCCESS_COLOR,
        ),
        (
            "Expenses",
            float(
                report.get(
                    "total_expenses",
                    0,
                )
            ),
            DANGER_COLOR,
        ),
        (
            "Balance",
            float(
                report.get(
                    "balance",
                    0,
                )
            ),
            SECONDARY_COLOR,
        ),
    ]

    max_value = max(
        [
            abs(value)
            for _, value, _ in values
        ] + [1]
    )

    pdf.setStrokeColor(
        BORDER_COLOR
    )

    for i in range(1, 5):

        grid_y = (
            graph_y
            + graph_height * i / 5
        )

        pdf.line(
            graph_x,
            grid_y,
            graph_x + graph_width,
            grid_y,
        )

    pdf.setStrokeColor(
        MUTED_COLOR
    )

    pdf.line(
        graph_x,
        graph_y,
        graph_x,
        graph_y + graph_height,
    )

    pdf.line(
        graph_x,
        graph_y,
        graph_x + graph_width,
        graph_y,
    )

    bar_width = 22 * mm

    gap = (
        graph_width
        - 3 * bar_width
    ) / 4

    for index, (
        label,
        value,
        bar_color,
    ) in enumerate(values):

        x = (
            graph_x
            + gap
            + index * (
                bar_width + gap
            )
        )

        bar_height = (
            abs(value)
            / max_value
            * graph_height
        )

        pdf.setFillColor(
            bar_color
        )

        pdf.roundRect(
            x,
            graph_y,
            bar_width,
            bar_height,
            2 * mm,
            fill=1,
            stroke=0,
        )

        pdf.setFont(
            "NotoSans-Bold",
            7,
        )

        pdf.setFillColor(
            TEXT_COLOR
        )

        pdf.drawCentredString(
            x + bar_width / 2,
            graph_y - 7 * mm,
            label,
        )

        pdf.setFont(
            "NotoSans",
            7,
        )

        pdf.setFillColor(
            MUTED_COLOR
        )

        pdf.drawCentredString(
            x + bar_width / 2,
            graph_y + bar_height + 3 * mm,
            format_currency(value),
        )


# ==========================================================
# CHART TITLE
# ==========================================================

def draw_chart_title(
    pdf,
    title,
    x,
    y,
):

    pdf.setFont(
        "NotoSans-Bold",
        11,
    )

    pdf.setFillColor(
        PRIMARY_COLOR
    )

    pdf.drawString(
        x,
        y,
        title,
    )


# ==========================================================
# CHART — SPENDING CATEGORY
# ==========================================================

def draw_spending_category_chart(
    pdf,
    report,
):

    chart_x = LEFT_MARGIN
    chart_y = PAGE_HEIGHT - 150 * mm

    chart_width = (
        PAGE_WIDTH
        - LEFT_MARGIN
        - RIGHT_MARGIN
    )

    chart_height = 82 * mm

    draw_chart_title(
        pdf,
        "Spending Distribution by Category",
        chart_x,
        chart_y + 5 * mm,
    )

    pdf.setFillColor(
        colors.white
    )

    pdf.setStrokeColor(
        BORDER_COLOR
    )

    pdf.roundRect(
        chart_x,
        chart_y - chart_height,
        chart_width,
        chart_height,
        4 * mm,
        fill=1,
        stroke=1,
    )

    categories = report.get(
        "spending_by_category",
        [],
    )

    if not categories:

        pdf.setFont(
            "NotoSans",
            9,
        )

        pdf.setFillColor(
            MUTED_COLOR
        )

        pdf.drawCentredString(
            chart_x + chart_width / 2,
            chart_y - chart_height / 2,
            "No spending data available.",
        )

        return

    total = sum(
        float(
            item["total"] or 0
        )
        for item in categories
    )

    if total <= 0:
        return

    center_x = (
        chart_x + 60 * mm
    )

    center_y = (
        chart_y
        - chart_height / 2
    )

    radius = 28 * mm

    chart_colors = [
        SECONDARY_COLOR,
        SUCCESS_COLOR,
        DANGER_COLOR,
        ORANGE_COLOR,
        PURPLE_COLOR,
        colors.HexColor("#0891B2"),
        colors.HexColor("#DB2777"),
        colors.HexColor("#65A30D"),
    ]

    start_angle = 0

    for index, item in enumerate(
        categories
    ):

        amount = float(
            item["total"] or 0
        )

        slice_angle = (
            amount
            / total
            * 360
        )

        pdf.setFillColor(
            chart_colors[
                index % len(chart_colors)
            ]
        )

        pdf.wedge(
            center_x - radius,
            center_y - radius,
            center_x + radius,
            center_y + radius,
            start_angle,
            slice_angle,
            fill=1,
            stroke=0,
        )

        start_angle += slice_angle

    legend_x = (
        chart_x + 105 * mm
    )

    legend_y = (
        chart_y - 15 * mm
    )

    pdf.setFont(
        "NotoSans",
        7,
    )

    for index, item in enumerate(
        categories
    ):

        if index >= 8:
            break

        amount = float(
            item["total"] or 0
        )

        percentage = (
            amount
            / total
            * 100
        )

        color = chart_colors[
            index % len(chart_colors)
        ]

        pdf.setFillColor(
            color
        )

        pdf.rect(
            legend_x,
            legend_y - 2 * mm,
            4 * mm,
            4 * mm,
            fill=1,
            stroke=0,
        )

        pdf.setFillColor(
            TEXT_COLOR
        )

        pdf.drawString(
            legend_x + 6 * mm,
            legend_y,
            str(
                item["category"]
            )[:20],
        )

        pdf.setFillColor(
            MUTED_COLOR
        )

        pdf.drawRightString(
            chart_x + chart_width - 8 * mm,
            legend_y,
            f"{percentage:.1f}%",
        )

        legend_y -= 8 * mm


# ==========================================================
# CHART — TRANSACTION COUNT
# ==========================================================

def draw_transaction_count_chart(
    pdf,
    report,
):

    chart_x = LEFT_MARGIN
    chart_y = PAGE_HEIGHT - 65 * mm

    chart_width = (
        PAGE_WIDTH
        - LEFT_MARGIN
        - RIGHT_MARGIN
    )

    chart_height = 70 * mm

    draw_chart_title(
        pdf,
        "Transaction Count",
        chart_x,
        chart_y + 5 * mm,
    )

    pdf.setFillColor(
        colors.white
    )

    pdf.setStrokeColor(
        BORDER_COLOR
    )

    pdf.roundRect(
        chart_x,
        chart_y - chart_height,
        chart_width,
        chart_height,
        4 * mm,
        fill=1,
        stroke=1,
    )

    counts = report.get(
        "transaction_counts",
        {},
    )

    income_count = int(
        counts.get(
            "income",
            0,
        )
    )

    expense_count = int(
        counts.get(
            "expense",
            0,
        )
    )

    values = [
        (
            "Income",
            income_count,
            SUCCESS_COLOR,
        ),
        (
            "Expense",
            expense_count,
            DANGER_COLOR,
        ),
    ]

    graph_x = chart_x + 20 * mm
    graph_y = chart_y - chart_height + 15 * mm

    graph_width = chart_width - 35 * mm
    graph_height = chart_height - 28 * mm

    max_value = max(
        income_count,
        expense_count,
        1,
    )

    pdf.setStrokeColor(
        BORDER_COLOR
    )

    for i in range(1, 5):

        grid_y = (
            graph_y
            + graph_height * i / 5
        )

        pdf.line(
            graph_x,
            grid_y,
            graph_x + graph_width,
            grid_y,
        )

    pdf.setStrokeColor(
        MUTED_COLOR
    )

    pdf.line(
        graph_x,
        graph_y,
        graph_x,
        graph_y + graph_height,
    )

    pdf.line(
        graph_x,
        graph_y,
        graph_x + graph_width,
        graph_y,
    )

    bar_width = 35 * mm

    gap = (
        graph_width
        - 2 * bar_width
    ) / 3

    for index, (
        label,
        value,
        bar_color,
    ) in enumerate(values):

        x = (
            graph_x
            + gap
            + index * (
                bar_width + gap
            )
        )

        bar_height = (
            value
            / max_value
            * graph_height
        )

        pdf.setFillColor(
            bar_color
        )

        pdf.roundRect(
            x,
            graph_y,
            bar_width,
            bar_height,
            2 * mm,
            fill=1,
            stroke=0,
        )

        pdf.setFont(
            "NotoSans-Bold",
            8,
        )

        pdf.setFillColor(
            TEXT_COLOR
        )

        pdf.drawCentredString(
            x + bar_width / 2,
            graph_y - 7 * mm,
            label,
        )

        pdf.setFont(
            "NotoSans-Bold",
            8,
        )

        pdf.setFillColor(
            MUTED_COLOR
        )

        pdf.drawCentredString(
            x + bar_width / 2,
            graph_y + bar_height + 3 * mm,
            str(value),
        )


# ==========================================================
# CHART — DAILY EXPENSE TREND
# ==========================================================

def draw_daily_expense_chart(
    pdf,
    report,
):

    chart_x = LEFT_MARGIN
    chart_y = PAGE_HEIGHT - 150 * mm

    chart_width = (
        PAGE_WIDTH
        - LEFT_MARGIN
        - RIGHT_MARGIN
    )

    chart_height = 82 * mm

    draw_chart_title(
        pdf,
        "Expense Trend",
        chart_x,
        chart_y + 5 * mm,
    )

    pdf.setFillColor(
        colors.white
    )

    pdf.setStrokeColor(
        BORDER_COLOR
    )

    pdf.roundRect(
        chart_x,
        chart_y - chart_height,
        chart_width,
        chart_height,
        4 * mm,
        fill=1,
        stroke=1,
    )

    daily_data = report.get(
        "daily_expense_trend",
        [],
    )

    if not daily_data:

        pdf.setFont(
            "NotoSans",
            9,
        )

        pdf.setFillColor(
            MUTED_COLOR
        )

        pdf.drawCentredString(
            chart_x + chart_width / 2,
            chart_y - chart_height / 2,
            "No expense trend data available.",
        )

        return

    graph_x = chart_x + 16 * mm
    graph_y = chart_y - chart_height + 15 * mm

    graph_width = chart_width - 28 * mm
    graph_height = chart_height - 28 * mm

    max_value = max(
        [
            float(
                item.get(
                    "amount",
                    0,
                )
            )
            for item in daily_data
        ] + [1]
    )

    pdf.setStrokeColor(
        BORDER_COLOR
    )

    for i in range(1, 5):

        grid_y = (
            graph_y
            + graph_height * i / 5
        )

        pdf.line(
            graph_x,
            grid_y,
            graph_x + graph_width,
            grid_y,
        )

    pdf.setStrokeColor(
        MUTED_COLOR
    )

    pdf.line(
        graph_x,
        graph_y,
        graph_x,
        graph_y + graph_height,
    )

    pdf.line(
        graph_x,
        graph_y,
        graph_x + graph_width,
        graph_y,
    )

    if len(daily_data) == 1:

        item = daily_data[0]

        x = (
            graph_x
            + graph_width / 2
        )

        y = (
            graph_y
            + (
                float(
                    item.get(
                        "amount",
                        0,
                    )
                )
                / max_value
            )
            * graph_height
        )

        pdf.setFillColor(
            DANGER_COLOR
        )

        pdf.circle(
            x,
            y,
            2 * mm,
            fill=1,
            stroke=0,
        )

        return

    previous_x = None
    previous_y = None

    pdf.setStrokeColor(
        DANGER_COLOR
    )

    pdf.setLineWidth(2)

    for index, item in enumerate(
        daily_data
    ):

        x = (
            graph_x
            + (
                index
                / (
                    len(daily_data) - 1
                )
            )
            * graph_width
        )

        y = (
            graph_y
            + (
                float(
                    item.get(
                        "amount",
                        0,
                    )
                )
                / max_value
            )
            * graph_height
        )

        if previous_x is not None:

            pdf.line(
                previous_x,
                previous_y,
                x,
                y,
            )

        pdf.setFillColor(
            DANGER_COLOR
        )

        pdf.circle(
            x,
            y,
            1.5 * mm,
            fill=1,
            stroke=0,
        )

        previous_x = x
        previous_y = y

    pdf.setLineWidth(1)


# ==========================================================
# PDF — ALL CHARTS
# ==========================================================

def draw_all_charts(
    pdf,
    report,
    range_type,
):

    pdf.showPage()

    draw_pdf_header(
        pdf,
        report,
        range_type,
    )

    draw_financial_overview_chart(
        pdf,
        report,
    )

    draw_spending_category_chart(
        pdf,
        report,
    )

    draw_pdf_footer(
        pdf,
    )

    pdf.showPage()

    draw_pdf_header(
        pdf,
        report,
        range_type,
    )

    draw_transaction_count_chart(
        pdf,
        report,
    )

    draw_daily_expense_chart(
        pdf,
        report,
    )

    draw_pdf_footer(
        pdf,
    )


# ==========================================================
# PDF EXPORT
# ==========================================================

@router.get(
    "/export/pdf",
)
def export_monthly_report_pdf(
    month: int | None = Query(
        None,
        ge=1,
        le=12,
    ),
    year: int | None = Query(
        None,
        ge=2000,
        le=2100,
    ),

    # IMPORTANT:
    # Do NOT name this Python variable "range".
    #
    # The URL parameter remains:
    # ?range=6_months
    #
    # FastAPI maps it to report_range.
    report_range: str | None = Query(
        "current_month",
        alias="range",
    ),

    start_date: str | None = Query(
        None,
    ),
    end_date: str | None = Query(
        None,
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(require_user),
):

    # ------------------------------------------------------
    # Premium/Admin only
    # ------------------------------------------------------

    require_export_access(
        current_user
    )

    # ------------------------------------------------------
    # Resolve requested report
    # ------------------------------------------------------

    (
        report,
        range_type,
        resolved_month,
        resolved_year,
    ) = resolve_export_report(
        db=db,
        current_user=current_user,
        month=month,
        year=year,
        range_type=report_range,
        start_date=start_date,
        end_date=end_date,
    )

    # Keep range information available to
    # chart pagination helpers.

    report["range"] = range_type

    # ------------------------------------------------------
    # Create PDF
    # ------------------------------------------------------

    buffer = BytesIO()

    pdf = canvas.Canvas(
        buffer,
        pagesize=A4,
    )

    # ------------------------------------------------------
    # PAGE 1
    # ------------------------------------------------------

    draw_pdf_header(
        pdf,
        report,
        range_type,
    )

    y = PAGE_HEIGHT - 55 * mm

    y = draw_section_title(
        pdf,
        "Financial Summary",
        y,
    )

    y = draw_summary_cards(
        pdf,
        report,
        y,
    )

    y = draw_monthly_summary_table(
        pdf,
        report,
        y,
    )

    y = draw_spending_table(
        pdf,
        report,
        y,
    )

    draw_recent_transactions(
        pdf,
        report,
        y,
    )

    draw_pdf_footer(
        pdf,
    )

    # ------------------------------------------------------
    # Charts
    # ------------------------------------------------------

    draw_all_charts(
        pdf,
        report,
        range_type,
    )

    # ------------------------------------------------------
    # Save
    # ------------------------------------------------------

    pdf.save()

    buffer.seek(0)

    # ------------------------------------------------------
    # Filename
    # ------------------------------------------------------

    if range_type == "custom":

        filename = (
            "budgetbuddy_report_"
            f"{start_date}_to_{end_date}.pdf"
        )

    elif range_type == "6_months":

        filename = (
            "budgetbuddy_report_last_6_months_"
            f"{resolved_year}_{resolved_month:02d}.pdf"
        )

    elif range_type == "12_months":

        filename = (
            "budgetbuddy_report_last_12_months_"
            f"{resolved_year}_{resolved_month:02d}.pdf"
        )

    else:

        filename = (
            "budgetbuddy_report_"
            f"{resolved_year}_{resolved_month:02d}.pdf"
        )

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f'attachment; filename="{filename}"',
        },
    )


# ==========================================================
# EXCEL EXPORT
# ==========================================================

@router.get(
    "/export/excel",
)
def export_monthly_report_excel(
    month: int | None = Query(
        None,
        ge=1,
        le=12,
    ),
    year: int | None = Query(
        None,
        ge=2000,
        le=2100,
    ),

    # IMPORTANT:
    # Keep URL parameter as "range",
    # but use "report_range" internally.
    #
    # This prevents:
    #
    # TypeError: 'str' object is not callable
    #
    # when using Python's:
    #
    # range(1, 3)
    report_range: str | None = Query(
        "current_month",
        alias="range",
    ),

    start_date: str | None = Query(
        None,
    ),
    end_date: str | None = Query(
        None,
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(require_user),
):

    # ------------------------------------------------------
    # Premium/Admin only
    # ------------------------------------------------------

    require_export_access(
        current_user
    )

    # ------------------------------------------------------
    # Resolve requested report
    # ------------------------------------------------------

    (
        report,
        range_type,
        resolved_month,
        resolved_year,
    ) = resolve_export_report(
        db=db,
        current_user=current_user,
        month=month,
        year=year,
        range_type=report_range,
        start_date=start_date,
        end_date=end_date,
    )

    # ------------------------------------------------------
    # Workbook
    # ------------------------------------------------------

    workbook = Workbook()

    worksheet = workbook.active

    worksheet.title = "Financial Report"

    # ======================================================
    # EXCEL STYLES
    # ======================================================

    header_fill = PatternFill(
        "solid",
        fgColor="173B5C",
    )

    section_fill = PatternFill(
        "solid",
        fgColor="EAF2F8",
    )

    alternate_fill = PatternFill(
        "solid",
        fgColor="F5F7FA",
    )

    white_font = Font(
        color="FFFFFF",
        bold=True,
    )

    title_font = Font(
        size=18,
        bold=True,
        color="173B5C",
    )

    section_font = Font(
        size=12,
        bold=True,
        color="173B5C",
    )

    normal_font = Font(
        size=11,
        color="173B5C",
    )

    thin_border = Border(
        left=Side(
            style="thin",
            color="D5DEE8",
        ),
        right=Side(
            style="thin",
            color="D5DEE8",
        ),
        top=Side(
            style="thin",
            color="D5DEE8",
        ),
        bottom=Side(
            style="thin",
            color="D5DEE8",
        ),
    )

    center_alignment = Alignment(
        horizontal="center",
        vertical="center",
    )

    left_alignment = Alignment(
        horizontal="left",
        vertical="center",
    )

    right_alignment = Alignment(
        horizontal="right",
        vertical="center",
    )

    # ======================================================
    # TITLE
    # ======================================================

    worksheet["A1"] = (
        "BudgetBuddy Financial Report"
    )

    worksheet["A1"].font = title_font

    worksheet.merge_cells(
        "A1:D1"
    )

    worksheet["A2"] = "Report Range"

    worksheet["B2"] = get_report_period_label(
        report,
        range_type,
    )

    worksheet["A3"] = "Start Date"

    worksheet["B3"] = format_transaction_date(
        report.get("start_date")
    )

    worksheet["A4"] = "End Date"

    worksheet["B4"] = format_transaction_date(
        report.get("end_date")
    )

    for cell in [
        worksheet["A2"],
        worksheet["A3"],
        worksheet["A4"],
    ]:

        cell.font = Font(
            bold=True,
            color="173B5C",
        )

    # ======================================================
    # FINANCIAL SUMMARY
    # ======================================================

    worksheet["A6"] = "Financial Summary"

    worksheet["A6"].font = section_font

    worksheet["A6"].fill = section_fill

    worksheet.merge_cells(
        "A6:B6"
    )

    summary_rows = [
        (
            "Total Income",
            report["total_income"],
        ),
        (
            "Total Expenses",
            report["total_expenses"],
        ),
        (
            "Net Balance",
            report["balance"],
        ),
    ]

    row = 7

    for label, value in summary_rows:

        worksheet.cell(
            row=row,
            column=1,
            value=label,
        )

        worksheet.cell(
            row=row,
            column=2,
            value=float(
                value or 0
            ),
        )

        worksheet.cell(
            row=row,
            column=1,
        ).font = normal_font

        worksheet.cell(
            row=row,
            column=2,
        ).font = normal_font

        worksheet.cell(
            row=row,
            column=2,
        ).number_format = (
            '₹#,##0.00'
        )

        worksheet.cell(
            row=row,
            column=1,
        ).border = thin_border

        worksheet.cell(
            row=row,
            column=2,
        ).border = thin_border

        row += 1

    # ======================================================
    # MONTHLY SUMMARY
    # ======================================================

    monthly_summary = report.get(
        "monthly_summary",
        [],
    )

    if len(monthly_summary) > 1:

        monthly_start = row + 2

        worksheet.cell(
            row=monthly_start,
            column=1,
            value="Monthly Breakdown",
        )

        worksheet.cell(
            row=monthly_start,
            column=1,
        ).font = section_font

        worksheet.cell(
            row=monthly_start,
            column=1,
        ).fill = section_fill

        worksheet.merge_cells(
            start_row=monthly_start,
            start_column=1,
            end_row=monthly_start,
            end_column=4,
        )

        monthly_headers = [
            "Month",
            "Income",
            "Expenses",
            "Balance",
        ]

        for column, header in enumerate(
            monthly_headers,
            start=1,
        ):

            cell = worksheet.cell(
                row=monthly_start + 1,
                column=column,
                value=header,
            )

            cell.fill = header_fill
            cell.font = white_font
            cell.border = thin_border
            cell.alignment = center_alignment

        row = monthly_start + 2

        for index, item in enumerate(
            monthly_summary
        ):

            values = [
                item["label"],
                float(
                    item["income"] or 0
                ),
                float(
                    item["expenses"] or 0
                ),
                float(
                    item["balance"] or 0
                ),
            ]

            for column, value in enumerate(
                values,
                start=1,
            ):

                cell = worksheet.cell(
                    row=row,
                    column=column,
                    value=value,
                )

                cell.border = thin_border
                cell.font = normal_font

                if column > 1:

                    cell.number_format = (
                        '₹#,##0.00'
                    )

                    cell.alignment = (
                        right_alignment
                    )

                else:

                    cell.alignment = (
                        left_alignment
                    )

                if index % 2 == 1:

                    cell.fill = (
                        alternate_fill
                    )

            row += 1

    # ======================================================
    # SPENDING BY CATEGORY
    # ======================================================

    category_start = row + 2

    worksheet.cell(
        row=category_start,
        column=1,
        value="Spending by Category",
    )

    worksheet.cell(
        row=category_start,
        column=1,
    ).font = section_font

    worksheet.cell(
        row=category_start,
        column=1,
    ).fill = section_fill

    worksheet.merge_cells(
        start_row=category_start,
        start_column=1,
        end_row=category_start,
        end_column=2,
    )

    worksheet.cell(
        row=category_start + 1,
        column=1,
        value="Category",
    )

    worksheet.cell(
        row=category_start + 1,
        column=2,
        value="Amount",
    )

    # IMPORTANT:
    #
    # This now uses Python's built-in range()
    # because the query parameter is called
    # report_range instead of range.

    for column in range(1, 3):

        cell = worksheet.cell(
            row=category_start + 1,
            column=column,
        )

        cell.fill = header_fill
        cell.font = white_font
        cell.border = thin_border
        cell.alignment = center_alignment

    row = category_start + 2

    categories = report.get(
        "spending_by_category",
        [],
    )

    for index, item in enumerate(
        categories
    ):

        worksheet.cell(
            row=row,
            column=1,
            value=str(
                item["category"]
            ),
        )

        worksheet.cell(
            row=row,
            column=2,
            value=float(
                item["total"] or 0
            ),
        )

        worksheet.cell(
            row=row,
            column=2,
        ).number_format = (
            '₹#,##0.00'
        )

        for column in range(1, 3):

            cell = worksheet.cell(
                row=row,
                column=column,
            )

            cell.border = thin_border
            cell.font = normal_font

            cell.alignment = (
                left_alignment
                if column == 1
                else right_alignment
            )

            if index % 2 == 1:

                cell.fill = (
                    alternate_fill
                )

        row += 1

    if not categories:

        worksheet.cell(
            row=row,
            column=1,
            value="No spending data available.",
        )

        worksheet.merge_cells(
            start_row=row,
            start_column=1,
            end_row=row,
            end_column=2,
        )

        worksheet.cell(
            row=row,
            column=1,
        ).font = Font(
            italic=True,
            color="64748B",
        )

        row += 1

    # ======================================================
    # TRANSACTIONS
    # ======================================================

    transaction_start = row + 2

    worksheet.cell(
        row=transaction_start,
        column=1,
        value="Transactions",
    )

    worksheet.cell(
        row=transaction_start,
        column=1,
    ).font = section_font

    worksheet.cell(
        row=transaction_start,
        column=1,
    ).fill = section_fill

    worksheet.merge_cells(
        start_row=transaction_start,
        start_column=1,
        end_row=transaction_start,
        end_column=4,
    )

    transaction_headers = [
        "Date",
        "Type",
        "Category",
        "Amount",
    ]

    for column, header in enumerate(
        transaction_headers,
        start=1,
    ):

        cell = worksheet.cell(
            row=transaction_start + 1,
            column=column,
            value=header,
        )

        cell.fill = header_fill
        cell.font = white_font
        cell.border = thin_border
        cell.alignment = center_alignment

    transaction_row = (
        transaction_start + 2
    )

    transactions = report.get(
        "recent_transactions",
        [],
    )

    for index, transaction in enumerate(
        transactions
    ):

        worksheet.cell(
            row=transaction_row,
            column=1,
            value=format_transaction_date(
                transaction.get("date")
            ),
        )

        worksheet.cell(
            row=transaction_row,
            column=2,
            value=str(
                transaction.get(
                    "type",
                    "",
                )
            ),
        )

        worksheet.cell(
            row=transaction_row,
            column=3,
            value=str(
                transaction.get(
                    "category",
                    "",
                )
            ),
        )

        worksheet.cell(
            row=transaction_row,
            column=4,
            value=float(
                transaction.get(
                    "amount",
                    0,
                ) or 0
            ),
        )

        worksheet.cell(
            row=transaction_row,
            column=4,
        ).number_format = (
            '₹#,##0.00'
        )

        for column in range(1, 5):

            cell = worksheet.cell(
                row=transaction_row,
                column=column,
            )

            cell.border = thin_border
            cell.font = normal_font

            cell.alignment = (
                right_alignment
                if column == 4
                else left_alignment
            )

            if index % 2 == 1:

                cell.fill = (
                    alternate_fill
                )

        transaction_row += 1

    if not transactions:

        worksheet.cell(
            row=transaction_row,
            column=1,
            value="No transactions available.",
        )

        worksheet.merge_cells(
            start_row=transaction_row,
            start_column=1,
            end_row=transaction_row,
            end_column=4,
        )

        worksheet.cell(
            row=transaction_row,
            column=1,
        ).font = Font(
            italic=True,
            color="64748B",
        )

    # ======================================================
    # COLUMN WIDTHS
    # ======================================================

    column_widths = {
        "A": 30,
        "B": 22,
        "C": 28,
        "D": 20,
    }

    for column, width in column_widths.items():

        worksheet.column_dimensions[
            column
        ].width = width

    # ======================================================
    # ROW HEIGHTS
    # ======================================================

    worksheet.row_dimensions[1].height = 28
    worksheet.row_dimensions[6].height = 22

    # ======================================================
    # FREEZE PANES
    # ======================================================

    worksheet.freeze_panes = (
        f"A{transaction_start + 2}"
    )

    # ======================================================
    # AUTO FILTER
    # ======================================================

    if transactions:

        worksheet.auto_filter.ref = (
            f"A{transaction_start + 1}:"
            f"D{transaction_start + 1 + len(transactions)}"
        )

    # ======================================================
    # SAVE
    # ======================================================

    buffer = BytesIO()

    workbook.save(
        buffer
    )

    buffer.seek(0)

    # ======================================================
    # FILENAME
    # ======================================================

    if range_type == "custom":

        filename = (
            "budgetbuddy_report_"
            f"{start_date}_to_{end_date}.xlsx"
        )

    elif range_type == "6_months":

        filename = (
            "budgetbuddy_report_last_6_months_"
            f"{resolved_year}_{resolved_month:02d}.xlsx"
        )

    elif range_type == "12_months":

        filename = (
            "budgetbuddy_report_last_12_months_"
            f"{resolved_year}_{resolved_month:02d}.xlsx"
        )

    else:

        filename = (
            "budgetbuddy_report_"
            f"{resolved_year}_{resolved_month:02d}.xlsx"
        )

    # ======================================================
    # RETURN EXCEL FILE
    # ======================================================

    return StreamingResponse(
        buffer,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition":
                f'attachment; filename="{filename}"',
        },
    )