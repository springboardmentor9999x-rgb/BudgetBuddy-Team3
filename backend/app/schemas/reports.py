from pydantic import BaseModel


# ==========================================================
# REPORT CATEGORY
# ==========================================================

class ReportCategory(BaseModel):
    category: str
    total: float


# ==========================================================
# REPORT MONTHLY
# ==========================================================

class MonthlyReportOut(BaseModel):
    month: int
    year: int

    total_income: float
    total_expenses: float
    balance: float

    spending_by_category: list[ReportCategory]