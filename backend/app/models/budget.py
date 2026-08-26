from sqlalchemy import Column, Integer, Float, Date, ForeignKey
from app.database import Base


class Budget(Base):

    __tablename__ = "budgets"

    budget_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    month = Column(
        Date,
        nullable=False
    )