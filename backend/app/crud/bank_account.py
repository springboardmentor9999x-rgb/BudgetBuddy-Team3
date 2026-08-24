from sqlalchemy.orm import Session

from app.models.bank_account import BankAccount
from app.models.income import Income
from app.models.expense import Expense
from app.models.savings_goal import SavingsGoal
from app.schemas.bank_account import BankAccountCreate


def create_bank_account(
    db: Session,
    user_id: int,
    account_in: BankAccountCreate
):
    # Check for duplicate account
    existing_account = (
        db.query(BankAccount)
        .filter(
            BankAccount.user_id == user_id,
            BankAccount.account_number == account_in.account_number
        )
        .first()
    )

    if existing_account:
        return None

    account = BankAccount(
        user_id=user_id,
        bank_name=account_in.bank_name,
        account_number=account_in.account_number,
        account_type=account_in.account_type,
        balance=account_in.balance
    )

    db.add(account)
    db.commit()
    db.refresh(account)

    return account


def get_bank_accounts_by_user(
    db: Session,
    user_id: int
):
    return (
        db.query(BankAccount)
        .filter(
            BankAccount.user_id == user_id
        )
        .all()
    )


def get_bank_account(
    db: Session,
    account_id: int,
    user_id: int
):
    return (
        db.query(BankAccount)
        .filter(
            BankAccount.id == account_id,
            BankAccount.user_id == user_id
        )
        .first()
    )


def update_bank_account(
    db: Session,
    account_id: int,
    user_id: int,
    account_in: BankAccountCreate
):
    account = get_bank_account(
        db,
        account_id,
        user_id
    )

    if not account:
        return None

    # Check whether another account already
    # uses this account number
    duplicate = (
        db.query(BankAccount)
        .filter(
            BankAccount.user_id == user_id,
            BankAccount.account_number == account_in.account_number,
            BankAccount.id != account_id
        )
        .first()
    )

    if duplicate:
        return None

    account.bank_name = account_in.bank_name
    account.account_number = account_in.account_number
    account.account_type = account_in.account_type
    account.balance = account_in.balance

    db.commit()
    db.refresh(account)

    return account


def delete_bank_account(
    db: Session,
    account_id: int,
    user_id: int
):
    account = get_bank_account(
        db,
        account_id,
        user_id
    )

    if not account:
        return None

    # ------------------------------------------------------
    # KEEP INCOME HISTORY
    # ------------------------------------------------------
    # Remove only the bank-account reference.
    # The income record itself is NOT deleted.
    db.query(Income).filter(
        Income.bank_account_id == account_id,
        Income.user_id == user_id
    ).update(
        {
            Income.bank_account_id: None
        },
        synchronize_session=False
    )

    # ------------------------------------------------------
    # KEEP EXPENSE HISTORY
    # ------------------------------------------------------
    # Remove only the bank-account reference.
    # The expense record itself is NOT deleted.
    db.query(Expense).filter(
        Expense.bank_account_id == account_id,
        Expense.user_id == user_id
    ).update(
        {
            Expense.bank_account_id: None
        },
        synchronize_session=False
    )

    # ------------------------------------------------------
    # KEEP SAVINGS GOAL
    # ------------------------------------------------------
    # Remove only the bank-account reference.
    # The savings goal itself is NOT deleted.
    db.query(SavingsGoal).filter(
        SavingsGoal.bank_account_id == account_id,
        SavingsGoal.user_id == user_id
    ).update(
        {
            SavingsGoal.bank_account_id: None
        },
        synchronize_session=False
    )

    # ------------------------------------------------------
    # DELETE ONLY THE BANK ACCOUNT
    # ------------------------------------------------------

    db.delete(account)

    db.commit()

    return account