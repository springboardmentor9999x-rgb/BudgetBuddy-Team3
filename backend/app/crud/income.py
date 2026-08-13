from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.bank_account import BankAccount
from app.models.income import Income
from app.schemas.income import IncomeCreate


# ==========================================================
# CREATE INCOME
# ==========================================================

def create_income(
    db: Session,
    user_id: int,
    income_in: IncomeCreate
):
    # Find selected bank account
    account = (
        db.query(BankAccount)
        .filter(
            BankAccount.id == income_in.bank_account_id,
            BankAccount.user_id == user_id
        )
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=400,
            detail="Invalid bank account"
        )

    income = Income(
        user_id=user_id,
        source=income_in.source,
        amount=income_in.amount,
        notes=income_in.notes,
        bank_account_id=income_in.bank_account_id
    )

    db.add(income)

    # Add income to bank balance
    account.balance += income_in.amount

    db.commit()
    db.refresh(income)

    return income


# ==========================================================
# GET ALL INCOMES
# ==========================================================

def get_incomes_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(Income)
        .filter(Income.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==========================================================
# GET SINGLE INCOME
# ==========================================================

def get_income(
    db: Session,
    income_id: int,
    user_id: int
):
    return (
        db.query(Income)
        .filter(
            Income.id == income_id,
            Income.user_id == user_id
        )
        .first()
    )


# ==========================================================
# UPDATE INCOME
# ==========================================================

def update_income(
    db: Session,
    income_id: int,
    user_id: int,
    income_in: IncomeCreate
):
    income = get_income(
        db,
        income_id,
        user_id
    )

    if not income:
        return None

    # Old bank account
    old_account = (
        db.query(BankAccount)
        .filter(
            BankAccount.id == income.bank_account_id,
            BankAccount.user_id == user_id
        )
        .first()
    )

    # New bank account
    new_account = (
        db.query(BankAccount)
        .filter(
            BankAccount.id == income_in.bank_account_id,
            BankAccount.user_id == user_id
        )
        .first()
    )

    if not new_account:
        raise HTTPException(
            status_code=400,
            detail="Invalid bank account"
        )

    # ======================================================
    # SAME BANK ACCOUNT
    # ======================================================

    if (
        old_account
        and old_account.id == new_account.id
    ):
        # Remove old income amount
        old_account.balance -= income.amount

        # Add new income amount
        new_account.balance += income_in.amount

    # ======================================================
    # DIFFERENT BANK ACCOUNT
    # ======================================================

    else:
        # Remove income from old account
        if old_account:
            old_account.balance -= income.amount

        # Add income to new account
        new_account.balance += income_in.amount

    # Update income record
    income.source = income_in.source
    income.amount = income_in.amount
    income.notes = income_in.notes
    income.bank_account_id = income_in.bank_account_id

    db.commit()
    db.refresh(income)

    return income


# ==========================================================
# DELETE INCOME
# ==========================================================

def delete_income(
    db: Session,
    income_id: int,
    user_id: int
):
    income = (
        db.query(Income)
        .filter(
            Income.id == income_id,
            Income.user_id == user_id
        )
        .first()
    )

    if not income:
        return None

    # Find associated bank account
    if income.bank_account_id is not None:

        account = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == income.bank_account_id,
                BankAccount.user_id == user_id
            )
            .first()
        )

        # Remove income from balance
        if account:
            account.balance -= income.amount

    db.delete(income)

    db.commit()

    return income