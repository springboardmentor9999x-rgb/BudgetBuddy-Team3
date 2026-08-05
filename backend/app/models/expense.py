from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    category = Column(
        String,
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    description = Column(
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
        back_populates="expenses"
    )