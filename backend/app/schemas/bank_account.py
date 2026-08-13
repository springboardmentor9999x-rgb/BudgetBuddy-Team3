from pydantic import BaseModel


class BankAccountCreate(BaseModel):
    bank_name: str
    account_number: str
    account_type: str
    balance: float = 0.0


class BankAccountOut(BaseModel):
    id: int
    bank_name: str
    account_number: str | None = None
    account_type: str
    balance: float

    class Config:
        from_attributes = True