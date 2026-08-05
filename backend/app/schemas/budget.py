from pydantic import BaseModel


class BudgetBase(BaseModel):
    category: str
    monthly_limit: float
    month_year: str


class BudgetCreate(BudgetBase):
    pass


class BudgetOut(BudgetBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True