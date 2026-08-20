from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base


class User(Base):
    __tablename__ = "users"

    # ==========================================================
    # BASIC USER DETAILS
    # ==========================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    hashed_password = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        default="student",
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    full_name = Column(
        String,
        nullable=True
    )

    phone = Column(
        String,
        nullable=True
    )

    # ==========================================================
    # EMAIL VERIFICATION
    # ==========================================================

    is_verified = Column(
        Boolean,
        default=False,
        nullable=False
    )

    verification_token = Column(
        String,
        nullable=True
    )

    verification_token_expires = Column(
        DateTime,
        nullable=True
    )

    # ==========================================================
    # PASSWORD RESET
    # ==========================================================

    reset_token = Column(
        String,
        nullable=True
    )

    reset_token_expires = Column(
        DateTime,
        nullable=True
    )

    # ==========================================================
    # INCOME
    # ==========================================================

    incomes = relationship(
        "Income",
        back_populates="owner"
    )

    # ==========================================================
    # EXPENSE
    # ==========================================================

    expenses = relationship(
        "Expense",
        back_populates="owner"
    )

    # ==========================================================
    # BUDGET
    # ==========================================================

    budgets = relationship(
        "Budget",
        back_populates="owner"
    )

    # ==========================================================
    # BANK ACCOUNTS
    # ==========================================================

    bank_accounts = relationship(
        "BankAccount",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # ==========================================================
    # SAVINGS GOALS
    # ==========================================================

    savings_goals = relationship(
        "SavingsGoal",
        back_populates="owner",
        cascade="all, delete-orphan"
    )

    # ==========================================================
    # NOTIFICATIONS
    # ==========================================================

    notifications = relationship(
        "Notification",
        back_populates="owner",
        cascade="all, delete-orphan"
    )