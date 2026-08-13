from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import hash_password


# ==========================================================
# GET USER BY EMAIL
# ==========================================================

def get_user_by_email(
    db: Session,
    email: str
):
    return (
        db.query(User)
        .filter(User.email == email)
        .first()
    )


# ==========================================================
# CREATE USER
# ==========================================================

def create_user(
    db: Session,
    email: str,
    password: str,
    full_name: str,
    phone: str | None = None
):
    user = User(
        email=email,
        full_name=full_name,
        phone=phone,
        hashed_password=hash_password(password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user