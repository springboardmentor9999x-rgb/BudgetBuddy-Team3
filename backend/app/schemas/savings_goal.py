from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class SavingsGoalBase(BaseModel):
    title: str
    target_amount: Decimal = Field(..., gt=0)
    current_amount: Decimal = Field(default=0, ge=0)
    target_date: date | None = None
    status: str = "in_progress"


class SavingsGoalCreate(SavingsGoalBase):
    pass


class SavingsGoalOut(SavingsGoalBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SavingsGoalContribute(BaseModel):
    amount: Decimal = Field(..., gt=0)