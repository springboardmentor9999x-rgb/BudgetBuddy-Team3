from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="student")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Existing profile relationship
    profile = relationship(
        "Profile",
        back_populates="owner",
        uselist=False
    )

    # Milestone 2 relationships
    expenses = relationship(
        "Expense",
        back_populates="owner"
    )

    incomes = relationship(
        "Income",
        back_populates="owner"
    )

    budgets = relationship(
        "Budget",
        back_populates="owner"
    )