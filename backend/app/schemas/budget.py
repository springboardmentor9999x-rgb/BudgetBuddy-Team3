from pydantic import BaseModel, Field


class BudgetBase(BaseModel):
    category: str
    monthly_limit: float = Field(..., gt=0)
    month_year: str


class BudgetCreate(BudgetBase):
    pass


class BudgetOut(BudgetBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True