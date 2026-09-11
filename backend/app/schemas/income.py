from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class IncomeBase(BaseModel):
    source: str = Field(
        ...,
        min_length=1,
        max_length=100
    )

    amount: float = Field(
        ...,
        gt=0
    )

    notes: str | None = Field(
        default=None,
        max_length=500
    )

    bank_account_id: int | None = Field(
        default=None,
        gt=0
    )

    @field_validator("source")
    @classmethod
    def validate_source(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError(
                "Income source cannot be empty"
            )

        return value

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, value: str | None):
        if value is None:
            return None

        value = value.strip()

        if not value:
            return None

        return value


class IncomeCreate(IncomeBase):
    date: datetime | None = None


class IncomeOut(IncomeBase):
    id: int
    date: datetime
    user_id: int

    class Config:
        from_attributes = True