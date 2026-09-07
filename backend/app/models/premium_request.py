from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class PremiumRequest(Base):
    __tablename__ = "premium_requests"

    request_id = Column(
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

    status = Column(
        String(20),
        nullable=False,
        default="PENDING",
        server_default="PENDING"
    )

    requested_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    processed_at = Column(
        DateTime,
        nullable=True
    )

    processed_by = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=True
    )

    # Relationships
    user = relationship(
        "User",
        foreign_keys=[user_id],
        backref="premium_requests"
    )

    processor = relationship(
        "User",
        foreign_keys=[processed_by]
    )
