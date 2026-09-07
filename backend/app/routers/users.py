from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user, require_admin


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)


class UserRoleUpdate(BaseModel):
    email: str
    role: str = Field(..., description="USER | PREMIUM_USER | ADMIN")


@router.get("/profile")
def get_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "user_id": current_user.user_id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "currency": "INR",
        "currency_symbol": "₹"
    }


@router.put("/profile")
def update_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.user_id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if profile_data.name is not None and profile_data.name.strip():
        user.name = profile_data.name.strip()

    db.commit()
    db.refresh(user)

    return {
        "message": "Profile updated successfully",
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }


# ==========================================
# ADMIN: SET USER ROLE
# ==========================================

@router.put("/admin/set-role")
def set_user_role(
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin-only endpoint to promote or demote a user's role.
    Allowed values: USER | PREMIUM_USER | ADMIN
    """
    allowed_roles = {"USER", "PREMIUM_USER", "ADMIN"}
    if role_update.role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {', '.join(allowed_roles)}"
        )

    target_user = db.query(User).filter(User.email == role_update.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = target_user.role
    target_user.role = role_update.role
    db.commit()

    return {
        "message": f"Role updated successfully",
        "user_id": target_user.user_id,
        "email": target_user.email,
        "old_role": old_role,
        "new_role": target_user.role
    }


# ==========================================
# ADMIN: DELETE USER ACCOUNT ALIAS
# ==========================================
@router.delete("/{user_id}")
def delete_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Protected endpoint to delete a user account.
    Delegates to delete_user_admin with full admin verification and constraint handling.
    """
    from app.routers.admin_users import delete_user_admin
    return delete_user_admin(user_id=user_id, db=db, current_user=current_user)

