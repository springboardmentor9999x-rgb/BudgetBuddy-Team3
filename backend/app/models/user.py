from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    password = Column(
        String,
        nullable=False
    )

    # ==========================================
    # ROLE-BASED ACCESS CONTROL
    # Values: USER | PREMIUM_USER | ADMIN
    # ==========================================

    role = Column(
        String(20),
        nullable=False,
        default="USER",
        server_default="USER"
    )

    # ==========================================
    # USER ACCOUNTS
    # ==========================================

    accounts = relationship(
        "Account",
        back_populates="user",
        cascade="all, delete-orphan"
    )