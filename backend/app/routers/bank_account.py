from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User

from app.schemas.bank_account import (
    BankAccountCreate,
    BankAccountOut
)

from app.crud.bank_account import (
    create_bank_account,
    get_bank_accounts_by_user,
    get_bank_account,
    update_bank_account,
    delete_bank_account
)

from app.core.deps import get_current_user


router = APIRouter()


# ==========================================================
# CREATE BANK ACCOUNT
# ==========================================================

@router.post("/", response_model=BankAccountOut)
def add_bank_account(
    account_in: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = create_bank_account(
        db,
        current_user.id,
        account_in
    )

    if not account:
        raise HTTPException(
            status_code=400,
            detail="This bank account already exists"
        )

    return account
# ==========================================================
# LIST BANK ACCOUNTS
# ==========================================================

@router.get("/", response_model=list[BankAccountOut])
def list_bank_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_bank_accounts_by_user(
        db,
        current_user.id
    )


# ==========================================================
# GET SINGLE BANK ACCOUNT
# ==========================================================

@router.get("/{account_id}", response_model=BankAccountOut)
def get_single_bank_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = get_bank_account(
        db,
        account_id,
        current_user.id
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Bank account not found"
        )

    return account


# ==========================================================
# UPDATE BANK ACCOUNT
# ==========================================================

@router.put("/{account_id}", response_model=BankAccountOut)
def edit_bank_account(
    account_id: int,
    account_in: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = update_bank_account(
        db,
        account_id,
        current_user.id,
        account_in
    )

    if not account:
        raise HTTPException(
            status_code=400,
            detail="Bank account not found or duplicate account"
        )

    return account
# ==========================================================
# DELETE BANK ACCOUNT
# ==========================================================

@router.delete("/{account_id}")
def remove_bank_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = delete_bank_account(
        db,
        account_id,
        current_user.id
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Bank account not found"
        )

    return {
        "message": "Bank account deleted successfully"
    }