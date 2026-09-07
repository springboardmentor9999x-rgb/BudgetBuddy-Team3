from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class NotificationOut(BaseModel):
    id: int

    user_id: int = Field(
        ...,
        gt=0
    )

    message: str = Field(
        ...,
        min_length=1,
        max_length=5000
    )

    type: str = Field(
        ...,
        min_length=1,
        max_length=100
    )

    is_read: bool

    created_at: datetime

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError(
                "Notification message cannot be empty"
            )

        return value

    @field_validator("type")
    @classmethod
    def validate_type(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError(
                "Notification type cannot be empty"
            )

        return value

    class Config:
        from_attributes = True