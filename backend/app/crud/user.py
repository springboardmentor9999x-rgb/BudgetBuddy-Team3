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


# ==========================================================
# PREMIUM TRIAL LENGTH
# ==========================================================

PREMIUM_TRIAL_DAYS = 30


# ==========================================================
# START PREMIUM TRIAL
# ==========================================================

def start_premium_trial(
    db: Session,
    user: User
):
    """
    Activate a one-month free Premium trial for a basic user.

    Eligibility:
        - Role must currently be "user" (not premium/admin).
        - The trial must not have been used before.

    Returns:
        (user, error)

        user  -> updated User on success, otherwise the
                 unmodified user
        error -> None on success, otherwise a short string
                 describing why the trial could not start
    """

    role = (user.role or "user").strip().lower()

    if role in {"premium", "admin"}:
        return user, "You already have premium access."

    if user.trial_used:
        return user, "You've already used your free premium trial."

    # Database DateTime columns are timezone-naive.
    now = datetime.utcnow()

    user.role = "premium"
    user.trial_used = True
    user.premium_expires_at = now + timedelta(
        days=PREMIUM_TRIAL_DAYS
    )
    user.cancellation_requested = False

    db.commit()
    db.refresh(user)

    return user, None


# ==========================================================
# CANCEL PREMIUM TRIAL (REVERSIBLE)
# ==========================================================
#
# Cancellation is a *reversible scheduling action*.
#
# It does NOT immediately revoke Premium access and does NOT
# touch premium_expires_at. It only flags the account so the
# plan will not continue past the current period. The user
# keeps full Premium access — and can undo this via
# reactivate_premium_trial() — for as long as:
#
#     current_date < premium_expires_at
#
# ==========================================================

def cancel_premium_trial(
    db: Session,
    user: User
):
    """
    Schedule cancellation of an active Premium trial.

    Eligibility:
        - Role must currently be "premium".
        - Must be a timed trial (premium_expires_at is set).
          Premium granted permanently by an admin (no expiry)
          cannot be self-cancelled here.

    Effects:
        - cancellation_requested is set to True.
        - role and premium_expires_at are left UNCHANGED, so
          Premium access continues until premium_expires_at.

    trial_used stays True — cancelling does not refund a
    fresh free trial.

    Returns:
        (user, error)

        user  -> updated User on success, otherwise the
                 unmodified user
        error -> None on success, otherwise a short string
                 describing why the trial could not be
                 cancelled
    """

    role = (user.role or "user").strip().lower()

    if role != "premium":
        return user, "You don't have an active premium plan."

    if user.premium_expires_at is None:
        return user, (
            "Your premium access was granted by an "
            "administrator and can't be self-cancelled."
        )

    # Already up-to-date; nothing further to do.
    if user.cancellation_requested:
        return user, None

    user.cancellation_requested = True

    db.commit()
    db.refresh(user)

    return user, None


# ==========================================================
# REACTIVATE PREMIUM TRIAL (UNDO CANCELLATION)
# ==========================================================
#
# Reverses a scheduled cancellation made via
# cancel_premium_trial(), as long as the original Premium
# period has not yet expired.
#
# IMPORTANT:
#   - Does NOT start a new trial.
#   - Does NOT change premium_expires_at.
#   - Does NOT charge the user.
#   - Does NOT touch trial_used.
#
# ==========================================================

def reactivate_premium_trial(
    db: Session,
    user: User
):
    """
    Undo a scheduled Premium cancellation.

    Eligibility:
        - Role must currently be "premium".
        - premium_expires_at must be set (timed trial).
        - current_date < premium_expires_at (the original
          period must not have expired).
        - cancellation_requested must currently be True.

    Effects:
        - cancellation_requested is set back to False.
        - role and premium_expires_at are left UNCHANGED.

    Returns:
        (user, error)

        user  -> updated User on success, otherwise the
                 unmodified user
        error -> None on success, otherwise a short string
                 describing why reactivation was not possible
    """

    role = (user.role or "user").strip().lower()

    if role != "premium":
        return user, "You don't have an active premium plan."

    if user.premium_expires_at is None:
        return user, (
            "Your premium access was granted by an "
            "administrator and doesn't need reactivation."
        )

    # Database DateTime columns are timezone-naive.
    if user.premium_expires_at <= datetime.utcnow():
        return user, (
            "Your premium trial has already ended. "
            "Please upgrade to Premium again to continue."
        )

    if not user.cancellation_requested:
        # Nothing was cancelled — treat as already active.
        return user, None

    user.cancellation_requested = False

    db.commit()
    db.refresh(user)

    return user, None


# ==========================================================
# DOWNGRADE EXPIRED PREMIUM TRIAL
# ==========================================================

def downgrade_if_trial_expired(
    db: Session,
    user: User
):
    """
    If the user's premium trial has expired, revert their
    role back to "user" and clear the expiry timestamp.

    This runs regardless of whether cancellation was ever
    requested — an expired trial always ends Premium access,
    and any pending cancellation flag is cleared along with
    it since there is nothing left to cancel.

    Admins and users without an active timed trial
    (premium_expires_at is None) are left untouched.
    """

    role = (user.role or "user").strip().lower()

    if role != "premium":
        return user

    if user.premium_expires_at is None:
        return user

    if user.premium_expires_at > datetime.utcnow():
        return user

    user.role = "user"
    user.premium_expires_at = None
    user.cancellation_requested = False

    db.commit()
    db.refresh(user)

    return user