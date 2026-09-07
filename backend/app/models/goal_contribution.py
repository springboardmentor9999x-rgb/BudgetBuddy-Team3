from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class GoalContribution(Base):
    """
    Tracks individual savings deposits to financial goals over time.
    Used for premium savings trend charts.
    """
    __tablename__ = "goal_contributions"

    contribution_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    goal_id = Column(
        Integer,
        ForeignKey("financial_goals.goal_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    amount = Column(
        Numeric(12, 2),
        nullable=False
    )

    contributed_at = Column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now()
    )
