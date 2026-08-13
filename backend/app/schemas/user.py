from datetime import datetime

from pydantic import BaseModel, EmailStr


# ==========================================================
# SIGNUP
# ==========================================================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str | None = None


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
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================================
# UPDATE NAME
# ==========================================================

class UserNameUpdate(BaseModel):
    full_name: str


# ==========================================================
# TOKEN
# ==========================================================

class Token(BaseModel):
    access_token: str
    token_type: str