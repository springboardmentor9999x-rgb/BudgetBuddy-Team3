from pydantic import BaseModel, Field
from datetime import date
from typing import Optional


class FinancialGoalCreate(BaseModel):
    goal_name: str = Field(..., min_length=1, max_length=150)
    target_amount: float = Field(..., gt=0)
    current_amount: Optional[float] = Field(default=0.0, ge=0)
    deadline: Optional[date] = None


class FinancialGoalUpdate(BaseModel):
    goal_name: Optional[str] = Field(None, min_length=1, max_length=150)
    target_amount: Optional[float] = Field(None, gt=0)
    current_amount: Optional[float] = Field(None, ge=0)
    deadline: Optional[date] = None


class FinancialGoalDeposit(BaseModel):
    amount: float = Field(..., gt=0)


class FinancialGoalResponse(BaseModel):
    goal_id: int
    user_id: int
    goal_name: str
    target_amount: float
    current_amount: float
    deadline: Optional[date] = None
    progress_percentage: float = 0.0
    is_completed: bool = False

    class Config:
        from_attributes = True
