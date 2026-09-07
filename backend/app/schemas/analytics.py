from pydantic import BaseModel


# ==========================================================
# SPENDING BY CATEGORY
# ==========================================================

class SpendingByCategoryOut(BaseModel):
    category: str
    total: float


# ==========================================================
# MONTHLY TREND
# ==========================================================

class MonthlyTrendOut(BaseModel):
    month: str
    total_income: float
    total_expenses: float


# ==========================================================
# SAVINGS PROGRESS
# ==========================================================

class SavingsProgressOut(BaseModel):
    id: int
    title: str
    target_amount: float
    current_amount: float
    percentage: float
    status: str


# ==========================================================
# ANALYTICS SUMMARY
# ==========================================================

class AnalyticsSummaryOut(BaseModel):
    total_income: float
    total_expenses: float
    net_balance: float
    savings_rate: float
    account_balance: float