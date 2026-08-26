from pydantic import BaseModel
from datetime import date


class IncomeCreate(BaseModel):
    amount: float
    source: str
    description: str | None = None
    income_date: date
    bank_name: str | None = None


class IncomeResponse(BaseModel):
    income_id: int
    user_id: int
    amount: float
    source: str
    description: str | None
    income_date: date
    bank_name: str | None = None

    class Config:
        from_attributes = True