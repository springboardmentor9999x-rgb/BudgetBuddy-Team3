from datetime import date
from pydantic import BaseModel


class BudgetCreate(BaseModel):
    amount: float
    month: date


class BudgetResponse(BaseModel):
    budget_id: int
    user_id: int
    amount: float
    month: date

    class Config:
        from_attributes = True