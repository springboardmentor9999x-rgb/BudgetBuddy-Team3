from datetime import datetime

from pydantic import BaseModel


# ==========================================================
# REPORT CATEGORY
# ==========================================================

class ReportCategory(BaseModel):
    category: str
    total: float


# ==========================================================
# REPORT TRANSACTION
# ==========================================================

class ReportTransaction(BaseModel):
    date: datetime
    type: str
    category: str
    amount: float


# ==========================================================
# FINANCIAL OVERVIEW
# ==========================================================

class FinancialOverview(BaseModel):
    income: float
    expenses: float
    balance: float


# ==========================================================
# TRANSACTION COUNTS
# ==========================================================

class TransactionCounts(BaseModel):
    income: int
    expense: int


# ==========================================================
# DAILY EXPENSE TREND
# ==========================================================

class DailyExpenseTrend(BaseModel):
    day: int
    amount: float


# ==========================================================
# REPORT MONTHLY
# ==========================================================

class MonthlyReportOut(BaseModel):
    month: int
    year: int

    # ------------------------------------------------------
    # FINANCIAL SUMMARY
    # ------------------------------------------------------

    total_income: float
    total_expenses: float
    balance: float

    # ------------------------------------------------------
    # SPENDING
    # ------------------------------------------------------

    spending_by_category: list[ReportCategory]

    # ------------------------------------------------------
    # RECENT TRANSACTIONS
    # ------------------------------------------------------

    recent_transactions: list[ReportTransaction]

    # ------------------------------------------------------
    # CHART 1
    # ------------------------------------------------------

    financial_overview: FinancialOverview

    # ------------------------------------------------------
    # CHART 3
    # ------------------------------------------------------

    transaction_counts: TransactionCounts

    # ------------------------------------------------------
    # CHART 4
    # ------------------------------------------------------

    daily_expense_trend: list[DailyExpenseTrend]