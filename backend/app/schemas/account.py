from pydantic import BaseModel
from typing import Optional


class AccountCreate(BaseModel):
    account_name: str
    account_type: str
    balance: float
    account_number: Optional[str] = None


class AccountResponse(BaseModel):
    account_id: int
    account_name: str
    account_type: str
    balance: float
    account_number: Optional[str] = None

    class Config:
        from_attributes = True