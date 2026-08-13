from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class User(Base):
    __tablename__ = "users"

    # ==========================================================
    # BASIC USER DETAILS
    # ==========================================================

    id = Column(Integer, primary_key=True, index=True)

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
        default="student"
    )

    is_active = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
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
    # Savings Goals
    savings_goals = relationship(
        "SavingsGoal",
        back_populates="owner",
        cascade="all, delete-orphan"
    )

# Notifications
    notifications = relationship(
        "Notification",
        back_populates="owner",
        cascade="all, delete-orphan"
    )