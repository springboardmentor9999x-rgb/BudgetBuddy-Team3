from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Date,
    DateTime,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class SavingsGoal(Base):

    __tablename__ = "savings_goals"

    # ==========================================================
    # PREVENT DUPLICATE SAVINGS GOALS FOR SAME USER
    # ==========================================================

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "title",
            name="uq_user_savings_goal_title"
        ),
    )

    # ==========================================================
    # PRIMARY KEY
    # ==========================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # ==========================================================
    # USER
    # ==========================================================

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    # ==========================================================
    # SAVINGS GOAL
    # ==========================================================

    title = Column(
        String,
        nullable=False
    )

    target_amount = Column(
        Numeric(12, 2),
        nullable=False
    )

    current_amount = Column(
        Numeric(12, 2),
        default=0,
        nullable=False
    )

    target_date = Column(
        Date,
        nullable=True
    )

    status = Column(
        String,
        default="in_progress",
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # ==========================================================
    # BANK ACCOUNT
    # ==========================================================

    bank_account_id = Column(
        Integer,
        ForeignKey("bank_accounts.id"),
        nullable=True
    )

    # ==========================================================
    # RELATIONSHIPS
    # ==========================================================

    owner = relationship(
        "User",
        back_populates="savings_goals"
    )

    bank_account = relationship(
        "BankAccount"
    )