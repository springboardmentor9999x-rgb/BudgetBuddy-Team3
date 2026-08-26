from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey
from app.database import Base


class FinancialGoal(Base):
    __tablename__ = "financial_goals"

    goal_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False,
        index=True
    )

    goal_name = Column(
        String(150),
        nullable=False
    )

    target_amount = Column(
        Numeric(12, 2),
        nullable=False
    )

    current_amount = Column(
        Numeric(12, 2),
        nullable=False,
        default=0.0
    )

    deadline = Column(
        Date,
        nullable=True
    )
