from io import BytesIO

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from reportlab.pdfgen import canvas
from openpyxl import Workbook

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User

from app.crud import reports as reports_crud
from app.schemas.reports import MonthlyReportOut


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


# ==========================================================
# MONTHLY REPORT
# ==========================================================

@router.get(
    "/monthly",
    response_model=MonthlyReportOut
)
def get_monthly_report(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return reports_crud.get_monthly_report(
        db,
        current_user.id,
        month,
        year
    )


# ==========================================================
# EXPORT MONTHLY REPORT AS PDF
# ==========================================================

@router.get(
    "/export/pdf"
)
def export_monthly_report_pdf(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ------------------------------------------------------
    # GET MONTHLY REPORT
    # ------------------------------------------------------

    report = reports_crud.get_monthly_report(
        db,
        current_user.id,
        month,
        year
    )

    # ------------------------------------------------------
    # CREATE PDF IN MEMORY
    # ------------------------------------------------------

    buffer = BytesIO()

    pdf = canvas.Canvas(buffer)

    # ------------------------------------------------------
    # TITLE
    # ------------------------------------------------------

    pdf.setFont(
        "Helvetica-Bold",
        18
    )

    pdf.drawString(
        50,
        800,
        "BudgetBuddy Monthly Report"
    )

    # ------------------------------------------------------
    # MONTH / YEAR
    # ------------------------------------------------------

    pdf.setFont(
        "Helvetica",
        12
    )

    pdf.drawString(
        50,
        770,
        f"Report: {month:02d}/{year}"
    )

    # ------------------------------------------------------
    # SUMMARY
    # ------------------------------------------------------

    pdf.setFont(
        "Helvetica-Bold",
        13
    )

    pdf.drawString(
        50,
        730,
        "Summary"
    )

    pdf.setFont(
        "Helvetica",
        11
    )

    pdf.drawString(
        70,
        705,
        f"Total Income: Rs. {report['total_income']:.2f}"
    )

    pdf.drawString(
        70,
        685,
        f"Total Expenses: Rs. {report['total_expenses']:.2f}"
    )

    pdf.drawString(
        70,
        665,
        f"Balance: Rs. {report['balance']:.2f}"
    )

    # ------------------------------------------------------
    # SPENDING BY CATEGORY
    # ------------------------------------------------------

    pdf.setFont(
        "Helvetica-Bold",
        13
    )

    pdf.drawString(
        50,
        625,
        "Spending by Category"
    )

    pdf.setFont(
        "Helvetica",
        11
    )

    y_position = 600

    for item in report["spending_by_category"]:

        pdf.drawString(
            70,
            y_position,
            f"{item['category']}: Rs. {item['total']:.2f}"
        )

        y_position -= 20

        # Start a new page if needed
        if y_position < 50:

            pdf.showPage()

            pdf.setFont(
                "Helvetica",
                11
            )

            y_position = 800

    # ------------------------------------------------------
    # FINISH PDF
    # ------------------------------------------------------

    pdf.save()

    buffer.seek(0)

    # ------------------------------------------------------
    # RETURN PDF
    # ------------------------------------------------------

    filename = (
        f"budgetbuddy_report_{year}_{month:02d}.pdf"
    )

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f"attachment; filename={filename}"
        }
    )


# ==========================================================
# EXPORT MONTHLY REPORT AS EXCEL
# ==========================================================

@router.get(
    "/export/excel"
)
def export_monthly_report_excel(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ------------------------------------------------------
    # GET MONTHLY REPORT
    # ------------------------------------------------------

    report = reports_crud.get_monthly_report(
        db,
        current_user.id,
        month,
        year
    )

    # ------------------------------------------------------
    # CREATE WORKBOOK
    # ------------------------------------------------------

    workbook = Workbook()

    worksheet = workbook.active

    worksheet.title = "Monthly Report"

    # ------------------------------------------------------
    # TITLE
    # ------------------------------------------------------

    worksheet["A1"] = "BudgetBuddy Monthly Report"

    worksheet["A2"] = "Month"
    worksheet["B2"] = month

    worksheet["A3"] = "Year"
    worksheet["B3"] = year

    # ------------------------------------------------------
    # SUMMARY
    # ------------------------------------------------------

    worksheet["A5"] = "Summary"

    worksheet["A6"] = "Total Income"
    worksheet["B6"] = float(
        report["total_income"]
    )

    worksheet["A7"] = "Total Expenses"
    worksheet["B7"] = float(
        report["total_expenses"]
    )

    worksheet["A8"] = "Balance"
    worksheet["B8"] = float(
        report["balance"]
    )

    # ------------------------------------------------------
    # SPENDING BY CATEGORY
    # ------------------------------------------------------

    worksheet["A10"] = "Spending by Category"

    worksheet["A11"] = "Category"
    worksheet["B11"] = "Total"

    row = 12

    for item in report["spending_by_category"]:

        worksheet.cell(
            row=row,
            column=1,
            value=item["category"]
        )

        worksheet.cell(
            row=row,
            column=2,
            value=float(item["total"])
        )

        row += 1

    # ------------------------------------------------------
    # COLUMN WIDTH
    # ------------------------------------------------------

    worksheet.column_dimensions["A"].width = 25
    worksheet.column_dimensions["B"].width = 20

    # ------------------------------------------------------
    # SAVE EXCEL TO MEMORY
    # ------------------------------------------------------

    buffer = BytesIO()

    workbook.save(buffer)

    buffer.seek(0)

    # ------------------------------------------------------
    # RETURN EXCEL
    # ------------------------------------------------------

    filename = (
        f"budgetbuddy_report_{year}_{month:02d}.xlsx"
    )

    return StreamingResponse(
        buffer,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition":
                f"attachment; filename={filename}"
        }
    )