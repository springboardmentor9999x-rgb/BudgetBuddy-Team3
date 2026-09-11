from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class ExpenseBase(BaseModel):
    category: str = Field(
        ...,
        min_length=1,
        max_length=100
    )

    amount: float = Field(
        ...,
        gt=0
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    bank_account_id: int | None = Field(
        default=None,
        gt=0
    )

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError(
                "Expense category cannot be empty"
            )

        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None):
        if value is None:
            return None

        value = value.strip()

        if not value:
            return None

        return value


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseOut(ExpenseBase):
    id: int
    date: datetime
    user_id: int

    class Config:
        from_attributes = True