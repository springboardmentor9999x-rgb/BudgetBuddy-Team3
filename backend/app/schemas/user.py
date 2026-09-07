from datetime import datetime
import re

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    field_validator,
)


# ==========================================================
# SIGNUP
# ==========================================================

class UserCreate(BaseModel):

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )

    full_name: str = Field(
        min_length=2,
        max_length=100
    )

    phone: str | None = Field(
        default=None,
        max_length=20
    )

    # ------------------------------------------------------
    # VALIDATE FULL NAME
    # ------------------------------------------------------

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str):

        value = value.strip()

        if not value:
            raise ValueError(
                "Full name cannot be empty"
            )

        if len(value) < 2:
            raise ValueError(
                "Full name must contain at least 2 characters"
            )

        # Names must contain letters.
        # Spaces, hyphens, apostrophes and periods are allowed
        # between name parts.
        if not re.fullmatch(
            r"[^\W\d_]+(?:[ .'-]+[^\W\d_]+)*",
            value,
            flags=re.UNICODE
        ):
            raise ValueError(
                "Full name must contain letters only"
            )

        return value

    # ------------------------------------------------------
    # VALIDATE PASSWORD
    # ------------------------------------------------------

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str):

        value = value.strip()

        if len(value) < 8:
            raise ValueError(
                "Password must contain at least 8 characters"
            )

        return value

    # ------------------------------------------------------
    # VALIDATE PHONE
    # ------------------------------------------------------

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None):

        if value is None:
            return None

        value = value.strip()

        if not value:
            return None

        return value


# ==========================================================
# USER OUTPUT
# ==========================================================

class UserOut(BaseModel):

    id: int

    email: EmailStr

    full_name: str | None = None

    phone: str | None = None

    role: str

    is_active: bool

    is_verified: bool

    created_at: datetime

    trial_used: bool

    premium_expires_at: datetime | None = None

    cancellation_requested: bool = False

    class Config:
        from_attributes = True


# ==========================================================
# UPDATE NAME
# ==========================================================

class UserNameUpdate(BaseModel):

    full_name: str = Field(
        min_length=2,
        max_length=100
    )

    # ------------------------------------------------------
    # VALIDATE FULL NAME
    # ------------------------------------------------------

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str):

        value = value.strip()

        if not value:
            raise ValueError(
                "Name cannot be empty"
            )

        if len(value) < 2:
            raise ValueError(
                "Name must contain at least 2 characters"
            )

        if not re.fullmatch(
            r"[^\W\d_]+(?:[ .'-]+[^\W\d_]+)*",
            value,
            flags=re.UNICODE
        ):
            raise ValueError(
                "Name must contain letters only"
            )

        return value


# ==========================================================
# UPDATE PROFILE
# ==========================================================

class UserProfileUpdate(BaseModel):

    """
    Users can update their own profile information.

    IMPORTANT:
    The role field is intentionally NOT included here.

    A user must never be able to change their own role
    through the profile update endpoint.

    Role changes will be handled separately by the
    appropriate admin functionality.
    """

    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    phone: str | None = Field(
        default=None,
        max_length=20
    )

    # ------------------------------------------------------
    # VALIDATE FULL NAME
    # ------------------------------------------------------

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str | None):

        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError(
                "Name cannot be empty"
            )

        if len(value) < 2:
            raise ValueError(
                "Name must contain at least 2 characters"
            )

        if not re.fullmatch(
            r"[^\W\d_]+(?:[ .'-]+[^\W\d_]+)*",
            value,
            flags=re.UNICODE
        ):
            raise ValueError(
                "Name must contain letters only"
            )

        return value

    # ------------------------------------------------------
    # VALIDATE PHONE
    # ------------------------------------------------------

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None):

        if value is None:
            return None

        value = value.strip()

        if not value:
            return None

        return value


# ==========================================================
# TOKEN
# ==========================================================

class Token(BaseModel):

    access_token: str

    token_type: str


# ==========================================================
# FORGOT PASSWORD
# ==========================================================

class ForgotPasswordRequest(BaseModel):

    email: EmailStr


# ==========================================================
# RESET PASSWORD
# ==========================================================

class ResetPasswordRequest(BaseModel):

    token: str

    new_password: str = Field(
        min_length=8,
        max_length=128
    )

    # ------------------------------------------------------
    # VALIDATE TOKEN
    # ------------------------------------------------------

    @field_validator("token")
    @classmethod
    def validate_token(cls, value: str):

        value = value.strip()

        if not value:
            raise ValueError(
                "Reset token is required"
            )

        return value

    # ------------------------------------------------------
    # VALIDATE PASSWORD
    # ------------------------------------------------------

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value: str):

        value = value.strip()

        if len(value) < 8:
            raise ValueError(
                "Password must contain at least 8 characters"
            )

        return value


# ==========================================================
# EMAIL VERIFICATION
# ==========================================================

class VerifyEmailRequest(BaseModel):

    token: str

    @field_validator("token")
    @classmethod
    def validate_token(cls, value: str):

        value = value.strip()

        if not value:
            raise ValueError(
                "Verification token is required"
            )

        return value


# ==========================================================
# RESEND VERIFICATION EMAIL
# ==========================================================

class ResendVerificationRequest(BaseModel):

    email: EmailStr