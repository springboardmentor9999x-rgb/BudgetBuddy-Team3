from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


# ==========================================================
# SAVINGS GOAL BASE
# ==========================================================

class SavingsGoalBase(BaseModel):

    title: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    target_amount: Decimal = Field(
        ...,
        gt=0
    )

    current_amount: Decimal = Field(
        default=0,
        ge=0
    )

    target_date: date | None = None

    status: str = Field(
        default="in_progress",
        min_length=1,
        max_length=30
    )

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError(
                "Savings goal title cannot be empty"
            )

        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError(
                "Savings goal status cannot be empty"
            )

        return value


# ==========================================================
# CREATE SAVINGS GOAL
#
# New savings goals MUST select a bank account.
# ==========================================================

class SavingsGoalCreate(SavingsGoalBase):

    bank_account_id: int = Field(
        ...,
        gt=0
    )


# ==========================================================
# SAVINGS GOAL RESPONSE
#
# bank_account_id is OPTIONAL here because older goals
# in the database may have NULL bank_account_id.
# ==========================================================

class SavingsGoalOut(SavingsGoalBase):

    id: int

    user_id: int

    created_at: datetime

    bank_account_id: int | None = None

    class Config:
        from_attributes = True


# ==========================================================
# CONTRIBUTE TO SAVINGS GOAL
# ==========================================================

class SavingsGoalContribute(BaseModel):

    amount: Decimal = Field(
        ...,
        gt=0
    )