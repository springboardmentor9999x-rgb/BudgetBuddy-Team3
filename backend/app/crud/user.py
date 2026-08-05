from sqlalchemy.orm import Session

from app.models.user import User
from app.models.profile import Profile

from app.core.security import hash_password


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def create_user(
    db: Session,
    email: str,
    password: str,
    full_name: str
):
    user = User(
        email=email,
        hashed_password=hash_password(password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    profile = Profile(
        user_id=user.id,
        full_name=full_name
    )

    db.add(profile)
    db.commit()

    return user