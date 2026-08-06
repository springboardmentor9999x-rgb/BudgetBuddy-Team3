from datetime import datetime
from pydantic import BaseModel, Field


class IncomeBase(BaseModel):
    source: str
    amount: float = Field(..., gt=0)
    notes: str | None = None


class IncomeCreate(IncomeBase):
    pass


class IncomeOut(IncomeBase):
    id: int
    date: datetime
    user_id: int

    class Config:
        from_attributes = True