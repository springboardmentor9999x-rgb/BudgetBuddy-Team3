from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AdminUserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: str
    is_active: bool = True
    trial_used: bool = False
    premium_expires_at: Optional[datetime] = None
    cancellation_requested: bool = False

    premium_request_status: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True
    )


class RoleUpdateRequest(BaseModel):
    role: str


class PremiumRequestResponse(BaseModel):
    id: int
    user_id: int
    status: str
    created_at: datetime
    user_email: Optional[str] = None
    user_name: Optional[str] = None


class MonthlyRegistration(BaseModel):
    month: str
    count: int


class SystemAnalyticsResponse(BaseModel):
    total_users: int
    basic_users: int
    premium_users: int
    admin_users: int
    active_users: int
    inactive_users: int
    trial_users: int

    total_income: float
    total_expenses: float
    total_savings: float

    monthly_registrations: list[MonthlyRegistration]

    pending_premium_requests: int