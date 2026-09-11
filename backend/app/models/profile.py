from sqlalchemy import Column, Integer, String, ForeignKey

from app.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        unique=True
    )

    full_name = Column(
        String,
        nullable=True
    )