from pydantic import BaseModel, Field, field_validator
import re


class BankAccountCreate(BaseModel):
    bank_name: str = Field(
        ...,
        min_length=1,
        max_length=100
    )

    account_number: str = Field(
        ...,
        min_length=8,
        max_length=20
    )

    account_type: str = Field(
        ...,
        min_length=1,
        max_length=50
    )

    balance: float = Field(
        default=0.0,
        ge=0
    )

    @field_validator("bank_name")
    @classmethod
    def validate_bank_name(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError(
                "Bank name cannot be empty"
            )

        if not re.fullmatch(
            r"[^\W\d_]+(?:[ .'-]+[^\W\d_]+)*",
            value,
            re.UNICODE
        ):
            raise ValueError(
                "Bank name must contain letters only"
            )

        return value

    @field_validator("account_number")
    @classmethod
    def validate_account_number(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError(
                "Account number cannot be empty"
            )

        if not value.isdigit():
            raise ValueError(
                "Account number must contain only digits"
            )

        if not 8 <= len(value) <= 20:
            raise ValueError(
                "Account number must be between 8 and 20 digits"
            )

        return value

    @field_validator("account_type")
    @classmethod
    def validate_account_type(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError(
                "Account type cannot be empty"
            )

        return value


class BankAccountOut(BaseModel):
    id: int
    bank_name: str
    account_number: str | None = None
    account_type: str
    balance: float

    class Config:
        from_attributes = True