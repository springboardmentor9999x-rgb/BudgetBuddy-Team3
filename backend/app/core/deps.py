from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.crud.user import get_user_by_email, downgrade_if_trial_expired
from app.core.security import SECRET_KEY, ALGORITHM


# ==========================================================
# OAUTH2
# ==========================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/login"
)


# ==========================================================
# GET CURRENT USER
# ==========================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Return the currently authenticated user.

    The user's email is taken from the JWT 'sub' claim.
    """

    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials"
    )

    try:

        # --------------------------------------------------
        # DECODE JWT
        # --------------------------------------------------

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        # --------------------------------------------------
        # GET EMAIL FROM TOKEN
        # --------------------------------------------------

        email = payload.get("sub")

        if email is None:
            raise credentials_exception

    except JWTError:

        raise credentials_exception

    # ------------------------------------------------------
    # FIND USER
    # ------------------------------------------------------

    user = get_user_by_email(
        db,
        email
    )

    if user is None:

        raise credentials_exception

    # ------------------------------------------------------
    # AUTO-DOWNGRADE EXPIRED PREMIUM TRIALS
    #
    # Checked on every authenticated request so that role
    # (and therefore premium access) is always accurate,
    # without needing a background job.
    # ------------------------------------------------------

    user = downgrade_if_trial_expired(db, user)

    # ------------------------------------------------------
    # CHECK WHETHER USER IS ACTIVE
    # ------------------------------------------------------

    if not user.is_active:

        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    return user


# ==========================================================
# REQUIRE LOGGED-IN USER
# ==========================================================

def require_user(
    current_user=Depends(get_current_user)
):
    """
    Allows any authenticated active user.

    Roles allowed:
        user
        premium
        admin
    """

    allowed_roles = {
        "user",
        "premium",
        "admin"
    }

    if current_user.role not in allowed_roles:

        raise HTTPException(
            status_code=403,
            detail="User role is not authorized"
        )

    return current_user


# ==========================================================
# REQUIRE PREMIUM USER
# ==========================================================

def require_premium(
    current_user=Depends(get_current_user)
):
    """
    Allows premium users and administrators.

    Roles allowed:
        premium
        admin
    """

    allowed_roles = {
        "premium",
        "admin"
    }

    if current_user.role not in allowed_roles:

        raise HTTPException(
            status_code=403,
            detail="Premium subscription required"
        )

    return current_user


# ==========================================================
# REQUIRE ADMIN USER
# ==========================================================

def require_admin(
    current_user=Depends(get_current_user)
):
    """
    Allows administrators only.

    Role allowed:
        admin
    """

    if current_user.role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Administrator access required"
        )

    return current_user