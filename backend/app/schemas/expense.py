from datetime import datetime
from pydantic import BaseModel


class ExpenseBase(BaseModel):
    category: str
    amount: float
    description: str | None = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseOut(ExpenseBase):
    id: int
    date: datetime
    user_id: int

    class Config:
        from_attributes = True