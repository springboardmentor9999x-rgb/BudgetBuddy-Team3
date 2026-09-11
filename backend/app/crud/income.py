from datetime import datetime

from sqlalchemy.orm import Session

from app.models.income import Income
from app.models.bank_account import BankAccount
from app.schemas.income import IncomeCreate


# ==========================================
# CREATE INCOME
# ==========================================

def create_income(
    db: Session,
    user_id: int,
    income: IncomeCreate
):
    account = None

    # ======================================
    # CHECK BANK ACCOUNT
    # ======================================

    if income.bank_account_id is not None:

        account = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == income.bank_account_id,
                BankAccount.user_id == user_id
            )
            .first()
        )

        if not account:
            return None

    # ======================================
    # CREATE INCOME
    # ======================================

    db_income = Income(
        user_id=user_id,
        bank_account_id=income.bank_account_id,
        source=income.source,
        amount=income.amount,
        notes=income.notes,
        date=income.date if income.date else datetime.utcnow(),
    )

    db.add(db_income)

    # ======================================
    # ADD INCOME TO BANK BALANCE
    # ======================================

    if account:
        account.balance += income.amount

    # ======================================
    # SAVE
    # ======================================

    db.commit()
    db.refresh(db_income)

    return db_income


# ==========================================
# GET ALL INCOMES FOR USER
# ==========================================

def get_incomes_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    month: int | None = None,
    year: int | None = None
):
    query = (
        db.query(Income)
        .filter(
            Income.user_id == user_id
        )
    )

    # ======================================
    # MONTH FILTER
    # ======================================

    if month is not None and year is not None:

        start_date = datetime(
            year,
            month,
            1
        )

        if month == 12:

            end_date = datetime(
                year + 1,
                1,
                1
            )

        else:

            end_date = datetime(
                year,
                month + 1,
                1
            )

        query = query.filter(
            Income.date >= start_date,
            Income.date < end_date
        )

    # ======================================
    # RETURN RESULTS
    # ======================================

    return (
        query
        .order_by(
            Income.date.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==========================================
# GET SINGLE INCOME
# ==========================================

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


# ==========================================
# UPDATE INCOME
# ==========================================

def update_income(
    db: Session,
    income_id: int,
    user_id: int,
    income: IncomeCreate
):
    db_income = (
        db.query(Income)
        .filter(
            Income.id == income_id,
            Income.user_id == user_id
        )
        .first()
    )

    if not db_income:
        return None

    # ======================================
    # OLD BANK ACCOUNT
    # ======================================

    old_account = None

    if db_income.bank_account_id is not None:

        old_account = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == db_income.bank_account_id,
                BankAccount.user_id == user_id
            )
            .first()
        )

    # ======================================
    # NEW BANK ACCOUNT
    # ======================================

    new_account = None

    if income.bank_account_id is not None:

        new_account = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == income.bank_account_id,
                BankAccount.user_id == user_id
            )
            .first()
        )

        if not new_account:
            return None

    # ======================================
    # REMOVE OLD INCOME FROM OLD ACCOUNT
    # ======================================

    if old_account:
        old_account.balance -= db_income.amount

    # ======================================
    # ADD NEW INCOME TO NEW ACCOUNT
    # ======================================

    if new_account:
        new_account.balance += income.amount

    # ======================================
    # UPDATE INCOME
    # ======================================

    db_income.bank_account_id = income.bank_account_id
    db_income.source = income.source
    db_income.amount = income.amount
    db_income.notes = income.notes

    if income.date:
        db_income.date = income.date

    # ======================================
    # SAVE
    # ======================================

    db.commit()
    db.refresh(db_income)

    return db_income


# ==========================================
# DELETE INCOME
# ==========================================

def delete_income(
    db: Session,
    income_id: int,
    user_id: int
):
    db_income = (
        db.query(Income)
        .filter(
            Income.id == income_id,
            Income.user_id == user_id
        )
        .first()
    )

    if not db_income:
        return None

    # ======================================
    # REMOVE INCOME FROM BANK BALANCE
    # ======================================

    if db_income.bank_account_id is not None:

        account = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == db_income.bank_account_id,
                BankAccount.user_id == user_id
            )
            .first()
        )

        if account:
            account.balance -= db_income.amount

    # ======================================
    # DELETE INCOME
    # ======================================

    db.delete(db_income)

    db.commit()

    return db_income