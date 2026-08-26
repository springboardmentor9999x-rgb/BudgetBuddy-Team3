from pydantic import BaseModel
from datetime import date
from decimal import Decimal


# User Schema
class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserResponse(BaseModel):
    user_id: int
    name: str
    email: str

    class Config:
        from_attributes = True


# Expense Schema
class ExpenseCreate(BaseModel):
    user_id: int
    category_id: int | None = None
    amount: Decimal
    description: str | None = None
    expense_date: date


class ExpenseResponse(BaseModel):
    expense_id: int
    user_id: int
    category_id: int | None
    amount: Decimal
    description: str | None
    expense_date: date

    class Config:
        from_attributes = True