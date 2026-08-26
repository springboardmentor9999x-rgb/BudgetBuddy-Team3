from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    monthly_budget_target: Optional[float] = None
    currency: Optional[str] = "INR"
    bio: Optional[str] = None


class UserResponse(BaseModel):
    user_id: int
    name: str
    email: str
    role: Optional[str] = "Student"

    class Config:
        from_attributes = True
