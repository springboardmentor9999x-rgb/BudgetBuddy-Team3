from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.account import Account
from app.schemas.account import AccountCreate, AccountResponse
from app.routers.auth import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/accounts",
    tags=["Accounts"]
)


# ==========================================
# GET ALL ACCOUNTS
# ==========================================
@router.get("/", response_model=list[AccountResponse])
def get_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    accounts = db.query(Account).filter(
        Account.user_id == current_user.user_id
    ).order_by(Account.account_id.desc()).all()

    return accounts


# ==========================================
# ADD ACCOUNT
# ==========================================
@router.post("/", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    account: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not account.account_name.strip():
        raise HTTPException(status_code=400, detail="Account name is required")

    new_account = Account(
        user_id=current_user.user_id,
        account_name=account.account_name.strip(),
        account_type=account.account_type,
        balance=account.balance,
        account_number=account.account_number.strip() if account.account_number else None
    )

    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    return new_account


# ==========================================
# UPDATE ACCOUNT
# ==========================================
@router.put("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: int,
    account_data: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(Account).filter(
        Account.account_id == account_id,
        Account.user_id == current_user.user_id
    ).first()

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Account not found"
        )

    account.account_name = account_data.account_name.strip()
    account.account_type = account_data.account_type
    account.balance = account_data.balance
    account.account_number = account_data.account_number.strip() if account_data.account_number else None

    db.commit()
    db.refresh(account)

    return account


# ==========================================
# DELETE ACCOUNT
# ==========================================
@router.delete("/{account_id}")
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(Account).filter(
        Account.account_id == account_id,
        Account.user_id == current_user.user_id
    ).first()

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Account not found"
        )

    db.delete(account)
    db.commit()

    return {
        "message": "Account deleted successfully"
    }