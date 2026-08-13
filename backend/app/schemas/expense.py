from datetime import datetime
from pydantic import BaseModel, Field


class ExpenseBase(BaseModel):
    category: str
    amount: float = Field(..., gt=0)
    description: str | None = None
    bank_account_id: int | None = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseOut(ExpenseBase):
    id: int
    date: datetime
    user_id: int

    class Config:
        from_attributes = True