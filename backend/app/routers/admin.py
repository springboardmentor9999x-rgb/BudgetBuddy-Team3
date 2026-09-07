from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.database import get_db
from app.models.user import User
from app.crud import admin as admin_crud
from app.schemas.admin import (
    AdminUserResponse,
    RoleUpdateRequest,
    SystemAnalyticsResponse,
)


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


# ==========================================================
# GET ALL USERS
# ==========================================================

@router.get(
    "/users",
    response_model=list[AdminUserResponse],
)
def list_users(
    search: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):

    users = admin_crud.get_users(
        db=db,
        search=search,
        skip=skip,
        limit=limit,
    )

    statuses = admin_crud.get_premium_request_statuses(
        db,
        users,
    )

    return [
        {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "role": user.role,
            "is_active": user.is_active,
            "trial_used": user.trial_used,
            "premium_expires_at": user.premium_expires_at,
            "cancellation_requested": user.cancellation_requested,

            "premium_request_status": (
                None
                if user.role == "admin"
                else statuses.get(user.id)
            ),
        }
        for user in users
    ]


# ==========================================================
# GET SINGLE USER
# ==========================================================

@router.get(
    "/users/{user_id}",
    response_model=AdminUserResponse,
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):

    user = admin_crud.get_user(
        db,
        user_id,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    statuses = admin_crud.get_premium_request_statuses(
        db,
        [user],
    )

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "role": user.role,
        "is_active": user.is_active,
        "trial_used": user.trial_used,
        "premium_expires_at": user.premium_expires_at,
        "cancellation_requested": user.cancellation_requested,

        "premium_request_status": (
            None
            if user.role == "admin"
            else statuses.get(user.id)
        ),
    }


# ==========================================================
# CHANGE USER ROLE
# ==========================================================

@router.patch(
    "/users/{user_id}/role",
    response_model=AdminUserResponse,
)
def change_user_role(
    user_id: int,
    payload: RoleUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):

    if payload.role not in {
        "user",
        "premium",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only user and premium roles can be assigned",
        )

    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot change their own role",
        )

    target_user = admin_crud.get_user(
        db,
        user_id,
    )

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if target_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The Admin account cannot be modified",
        )

    target_user.role = payload.role

    db.commit()
    db.refresh(target_user)

    statuses = admin_crud.get_premium_request_statuses(
        db,
        [target_user],
    )

    return {
        "id": target_user.id,
        "email": target_user.email,
        "full_name": target_user.full_name,
        "phone": target_user.phone,
        "role": target_user.role,
        "is_active": target_user.is_active,
        "trial_used": target_user.trial_used,
        "premium_expires_at": target_user.premium_expires_at,
        "cancellation_requested": target_user.cancellation_requested,

        "premium_request_status": statuses.get(
            target_user.id
        ),
    }


# ==========================================================
# ACCEPT PREMIUM REQUEST
# ==========================================================

@router.post(
    "/users/{user_id}/premium-request/approve",
    response_model=AdminUserResponse,
)
def approve_premium_request(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):

    user, error = admin_crud.approve_premium_request(
        db,
        user_id,
    )

    if error:

        if error == "User not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error,
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=error,
        )

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "role": user.role,
        "is_active": user.is_active,
        "trial_used": user.trial_used,
        "premium_expires_at": user.premium_expires_at,
        "cancellation_requested": user.cancellation_requested,

        "premium_request_status": "approved",
    }


# ==========================================================
# REJECT PREMIUM REQUEST
# ==========================================================

@router.post(
    "/users/{user_id}/premium-request/reject",
    response_model=AdminUserResponse,
)
def reject_premium_request(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):

    user, error = admin_crud.reject_premium_request(
        db,
        user_id,
    )

    if error:

        if error == "User not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error,
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=error,
        )

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "role": user.role,
        "is_active": user.is_active,
        "trial_used": user.trial_used,
        "premium_expires_at": user.premium_expires_at,
        "cancellation_requested": user.cancellation_requested,

        "premium_request_status": "rejected",
    }


# ==========================================================
# SYSTEM ANALYTICS
# ==========================================================

@router.get(
    "/system-analytics",
    response_model=SystemAnalyticsResponse,
)
def system_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):

    return admin_crud.get_system_analytics(db)