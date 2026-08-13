from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base


class BankAccount(Base):

    __tablename__ = "bank_accounts"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "bank_name",
            "account_type",
            name="uq_user_bank_account_type"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    bank_name = Column(
        String,
        nullable=False
    )

    account_number = Column(
        String,
        nullable=True
    )

    account_type = Column(
        String,
        nullable=False
    )

    balance = Column(
        Float,
        default=0.0,
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="bank_accounts"
    )

    incomes = relationship(
        "Income",
        back_populates="bank_account"
    )

    expenses = relationship(
        "Expense",
        back_populates="bank_account"
    )