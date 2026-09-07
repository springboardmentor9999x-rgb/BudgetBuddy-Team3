from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.premium_request import PremiumRequest
from app.models.notification import Notification
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/premium",
    tags=["Premium Upgrade"]
)


# ==========================================
# USER: SUBMIT PREMIUM UPGRADE REQUEST
# ==========================================
@router.post("/request", status_code=status.HTTP_201_CREATED)
def request_premium_upgrade(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allow authenticated USER accounts to submit a request for a Premium upgrade.
    Prevents duplicate pending requests and notifies all active Admin users.
    """
    if current_user.role in ("PREMIUM_USER", "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Your account already has {current_user.role} privileges."
        )

    # Check for existing PENDING request
    existing_pending = (
        db.query(PremiumRequest)
        .filter(
            PremiumRequest.user_id == current_user.user_id,
            PremiumRequest.status == "PENDING"
        )
        .first()
    )

    if existing_pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending Premium upgrade request. Please wait for an administrator to review it."
        )

    # Create new PENDING request
    new_request = PremiumRequest(
        user_id=current_user.user_id,
        status="PENDING",
        requested_at=datetime.utcnow()
    )
    db.add(new_request)
    db.flush()  # populate request_id

    # Notify all Admin users
    admins = db.query(User).filter(User.role == "ADMIN").all()
    for admin in admins:
        admin_notif = Notification(
            user_id=admin.user_id,
            title="New Premium Upgrade Request",
            message=f"{current_user.name} ({current_user.email}) requested a Premium Member upgrade.",
            action_url=f"/admin/users?highlightUser={current_user.user_id}&requestId={new_request.request_id}",
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(admin_notif)

    db.commit()
    db.refresh(new_request)

    return {
        "message": "Premium upgrade request submitted successfully! An administrator will review your request shortly.",
        "request_id": new_request.request_id,
        "status": new_request.status,
        "requested_at": new_request.requested_at
    }


# ==========================================
# USER: GET PREMIUM REQUEST STATUS
# ==========================================
@router.get("/request-status")
def get_premium_request_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns current user's role and latest upgrade request status.
    """
    latest_request = (
        db.query(PremiumRequest)
        .filter(PremiumRequest.user_id == current_user.user_id)
        .order_by(PremiumRequest.requested_at.desc())
        .first()
    )

    if not latest_request:
        return {
            "has_request": False,
            "status": None,
            "requested_at": None,
            "processed_at": None,
            "role": current_user.role
        }

    return {
        "has_request": True,
        "request_id": latest_request.request_id,
        "status": latest_request.status,
        "requested_at": latest_request.requested_at,
        "processed_at": latest_request.processed_at,
        "role": current_user.role
    }
