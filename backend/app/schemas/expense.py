from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    category_id: int
    amount: float = Field(..., gt=0)
    description: Optional[str] = None
    expense_date: date


class ExpenseUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None
    expense_date: Optional[date] = None


class ExpenseResponse(BaseModel):
    expense_id: int
    user_id: int
    category_id: int
    category_name: Optional[str] = "General"
    amount: float
    description: Optional[str] = None
    expense_date: date

    class Config:
        from_attributes = True