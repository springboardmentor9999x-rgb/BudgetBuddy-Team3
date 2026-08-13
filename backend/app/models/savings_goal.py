from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    title = Column(String, nullable=False)

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

    # Relationship back to User
    owner = relationship(
        "User",
        back_populates="savings_goals"
    )