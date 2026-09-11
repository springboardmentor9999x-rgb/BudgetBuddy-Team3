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

    # ==========================================================
    # USER ROLE
    #
    # Allowed application roles:
    #
    # user    -> Basic/free user
    # premium -> Premium user
    # admin   -> Administrator
    #
    # IMPORTANT:
    # Existing users with "student" will NOT automatically change
    # just because the model default changes.
    # We will handle existing database users separately.
    # ==========================================================

    role = Column(
        String,
        default="user",
        nullable=False
    )

    # ==========================================================
    # PREMIUM TRIAL TRACKING
    #
    # trial_used         -> True once the user has ever started
    #                        a free premium trial (prevents
    #                        repeat free trials).
    #
    # premium_expires_at -> When the current premium trial ends.
    #                        NULL means no active timed trial
    #                        (e.g. free/basic users, or premium
    #                        granted permanently by an admin).
    # ==========================================================

    trial_used = Column(
        Boolean,
        default=False,
        nullable=False
    )

    premium_expires_at = Column(
        DateTime,
        nullable=True
    )

    # ==========================================================
    # PREMIUM CANCELLATION (REVERSIBLE)
    #
    # cancellation_requested -> True once the user has asked to
    #                            cancel their CURRENT Premium
    #                            trial/subscription period.
    #
    # IMPORTANT:
    # Cancellation does NOT revoke Premium access immediately.
    # It only stops the plan from continuing past
    # premium_expires_at. While
    #     current_date < premium_expires_at
    # the user keeps full Premium access and may reactivate
    # (setting this back to False) without starting a new
    # trial and without changing premium_expires_at.
    # ==========================================================

    cancellation_requested = Column(
        Boolean,
        default=False,
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