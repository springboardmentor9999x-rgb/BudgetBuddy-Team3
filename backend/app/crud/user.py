from datetime import datetime, timedelta
import secrets

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
        hashed_password=hash_password(password),

        # Email verification
        is_verified=False,
        verification_token=None,
        verification_token_expires=None,

        # Password reset
        reset_token=None,
        reset_token_expires=None
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# ==========================================================
# CREATE / RECREATE EMAIL VERIFICATION TOKEN
# ==========================================================

def create_verification_token(
    db: Session,
    user: User
):
    """
    Create a secure email verification token.

    The previous token, if any, is replaced.

    Token validity:
        24 hours
    """

    token = secrets.token_urlsafe(32)

    user.verification_token = token

    # Database DateTime columns are timezone-naive.
    user.verification_token_expires = (
        datetime.utcnow() + timedelta(hours=24)
    )

    db.commit()
    db.refresh(user)

    return token


# ==========================================================
# VERIFY EMAIL
# ==========================================================

def verify_email(
    db: Session,
    token: str
):
    """
    Verify a user's email using the verification token.

    Returns:
        User -> verification successful
        None -> invalid or expired token
    """

    # ------------------------------------------------------
    # FIND USER USING TOKEN
    # ------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.verification_token == token
        )
        .first()
    )

    # ------------------------------------------------------
    # TOKEN NOT FOUND
    # ------------------------------------------------------

    if not user:
        return None

    # ------------------------------------------------------
    # TOKEN EXPIRED
    # ------------------------------------------------------

    if (
        user.verification_token_expires is None
        or user.verification_token_expires < datetime.utcnow()
    ):

        # Clear expired token
        user.verification_token = None
        user.verification_token_expires = None

        db.commit()

        return None

    # ------------------------------------------------------
    # MARK EMAIL AS VERIFIED
    # ------------------------------------------------------

    user.is_verified = True

    # ------------------------------------------------------
    # INVALIDATE TOKEN
    # ------------------------------------------------------

    user.verification_token = None
    user.verification_token_expires = None

    db.commit()
    db.refresh(user)

    return user


# ==========================================================
# CREATE PASSWORD RESET TOKEN
# ==========================================================

def create_reset_token(
    db: Session,
    user: User
):
    """
    Create a secure password reset token.

    The previous token, if any, is replaced.

    Token validity:
        1 hour
    """

    token = secrets.token_urlsafe(32)

    user.reset_token = token

    # Database DateTime columns are timezone-naive.
    user.reset_token_expires = (
        datetime.utcnow() + timedelta(hours=1)
    )

    db.commit()
    db.refresh(user)

    return token


# ==========================================================
# GET USER BY RESET TOKEN
# ==========================================================

def get_user_by_reset_token(
    db: Session,
    token: str
):
    """
    Find a user using a password reset token.

    Returns:
        User -> valid token
        None -> invalid or expired token
    """

    # ------------------------------------------------------
    # FIND USER USING TOKEN
    # ------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.reset_token == token
        )
        .first()
    )

    # ------------------------------------------------------
    # TOKEN NOT FOUND
    # ------------------------------------------------------

    if not user:
        return None

    # ------------------------------------------------------
    # TOKEN EXPIRED
    # ------------------------------------------------------

    if (
        user.reset_token_expires is None
        or user.reset_token_expires < datetime.utcnow()
    ):

        # Clear expired token
        user.reset_token = None
        user.reset_token_expires = None

        db.commit()

        return None

    return user


# ==========================================================
# RESET PASSWORD
# ==========================================================

def reset_password(
    db: Session,
    user: User,
    new_password: str
):
    """
    Update the user's password and invalidate
    the reset token so it cannot be reused.
    """

    user.hashed_password = hash_password(
        new_password
    )

    # ------------------------------------------------------
    # INVALIDATE RESET TOKEN
    # ------------------------------------------------------

    user.reset_token = None
    user.reset_token_expires = None

    db.commit()
    db.refresh(user)

    return user


# ==========================================================
# CLEAR VERIFICATION TOKEN
# ==========================================================

def clear_verification_token(
    db: Session,
    user: User
):
    """
    Manually clear a verification token.
    """

    user.verification_token = None
    user.verification_token_expires = None

    db.commit()
    db.refresh(user)

    return user


# ==========================================================
# CLEAR RESET TOKEN
# ==========================================================

def clear_reset_token(
    db: Session,
    user: User
):
    """
    Manually clear a password reset token.
    """

    user.reset_token = None
    user.reset_token_expires = None

    db.commit()
    db.refresh(user)

    return user