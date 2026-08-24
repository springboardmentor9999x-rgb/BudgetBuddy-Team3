from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )
    goal_id = Column(
        Integer,
        ForeignKey("savings_goals.id"),
        nullable=True
    )

    message = Column(
        String,
        nullable=False
    )

    type = Column(
        String,
        nullable=False
    )

    is_read = Column(
        Boolean,
        default=False,
        nullable=False
    )

    # ------------------------------------------------------
    # IMPORTANT
    #
    # Database stores UTC.
    #
    # The column remains compatible with the existing
    # PostgreSQL timestamp column.
    # ------------------------------------------------------

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # ------------------------------------------------------
    # RELATIONSHIP BACK TO USER
    # ------------------------------------------------------

    owner = relationship(
        "User",
        back_populates="notifications"
    )