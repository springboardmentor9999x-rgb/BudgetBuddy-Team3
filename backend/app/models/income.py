from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Income(Base):
    __tablename__ = "incomes"

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

    bank_account_id = Column(
        Integer,
        ForeignKey("bank_accounts.id"),
        nullable=True
    )

    source = Column(
        String,
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    notes = Column(
        String,
        nullable=True
    )

    date = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    owner = relationship(
        "User",
        back_populates="incomes"
    )

    bank_account = relationship(
        "BankAccount",
        back_populates="incomes"
    )