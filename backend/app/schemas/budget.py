from pydantic import BaseModel, Field, field_validator


class BudgetBase(BaseModel):
    category: str = Field(
        ...,
        min_length=1,
        max_length=100
    )

    monthly_limit: float = Field(
        ...,
        gt=0
    )

    month_year: str = Field(
        ...,
        min_length=7,
        max_length=7
    )

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError(
                "Budget category cannot be empty"
            )

        return value

    @field_validator("month_year")
    @classmethod
    def validate_month_year(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError(
                "Month and year are required"
            )

        parts = value.split("-")

        if (
            len(parts) != 2
            or len(parts[0]) != 4
            or len(parts[1]) != 2
            or not parts[0].isdigit()
            or not parts[1].isdigit()
        ):
            raise ValueError(
                "Month and year must be in YYYY-MM format"
            )

        year = int(parts[0])
        month = int(parts[1])

        if year < 2000 or year > 2100:
            raise ValueError(
                "Year must be between 2000 and 2100"
            )

        if month < 1 or month > 12:
            raise ValueError(
                "Month must be between 01 and 12"
            )

        return value


class BudgetCreate(BudgetBase):
    pass


class BudgetOut(BudgetBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True