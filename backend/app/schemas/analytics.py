from pydantic import BaseModel
from typing import Optional


class SpendingByCategoryResponse(BaseModel):
    category: str
    amount: float
    percentage: float


class SummaryResponse(BaseModel):
    total_income: float
    total_expenses: float
    net_balance: float
    savings_rate: float
    period_label: str


class MonthlyTrendItem(BaseModel):
    month: str
    income: float
    expense: float
    savings: float


class CategoryOverTimeItem(BaseModel):
    month: str
    category: str
    amount: float


class ComparisonResponse(BaseModel):
    current_month_label: str
    previous_month_label: str
    current_income: float
    previous_income: float
    income_change_pct: Optional[float]
    current_expense: float
    previous_expense: float
    expense_change_pct: Optional[float]
    current_savings: float
    previous_savings: float


class GoalProgressResponse(BaseModel):
    goal_id: int
    goal_name: str
    target_amount: float
    current_amount: float
    progress_percentage: float
    is_completed: bool
    deadline: Optional[str]


class SystemAnalyticsResponse(BaseModel):
    total_users: int
    total_active_users: int
    total_premium_users: int
    total_admin_users: int
    total_income_records: int
    total_expense_records: int
    total_budgets: int
    total_goals: int
    total_income_volume: float
    total_expense_volume: float
    platform_net_savings: float
    top_spending_categories: list
