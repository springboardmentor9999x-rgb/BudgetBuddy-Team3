from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Account(Base):
    __tablename__ = "accounts"

    account_id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    account_name = Column(
        String(100),
        nullable=False
    )

    account_type = Column(
        String(50),
        nullable=False
    )

    balance = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    account_number = Column(
        String(50),
        nullable=True
    )

    user = relationship(
        "User",
        back_populates="accounts"
    )