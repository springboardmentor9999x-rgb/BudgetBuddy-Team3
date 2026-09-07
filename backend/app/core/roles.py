from fastapi import Depends, HTTPException, status

from app.core.deps import get_current_user
from app.models.user import User


# ==========================================================
# ROLE CHECKING
# ==========================================================

def require_role(*allowed_roles: str):

    def role_checker(
        current_user: User = Depends(get_current_user)
    ):

        user_role = (
            current_user.role or "user"
        ).strip().lower()

        allowed = {
            role.strip().lower()
            for role in allowed_roles
        }

        if user_role not in allowed:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource."
            )

        return current_user

    return role_checker


# ==========================================================
# USER ROLE
# ==========================================================

def require_user(
    current_user: User = Depends(get_current_user)
):
    role = (
        current_user.role or "user"
    ).strip().lower()

    if role not in {
        "user",
        "premium",
        "admin"
    }:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid user role."
        )

    return current_user


# ==========================================================
# PREMIUM OR ADMIN
# ==========================================================

def require_premium(
    current_user: User = Depends(get_current_user)
):

    role = (
        current_user.role or "user"
    ).strip().lower()

    if role not in {
        "premium",
        "admin"
    }:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required."
        )

    return current_user


# ==========================================================
# ADMIN ONLY
# ==========================================================

def require_admin(
    current_user: User = Depends(get_current_user)
):

    role = (
        current_user.role or "user"
    ).strip().lower()

    if role != "admin":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required."
        )

    return current_user