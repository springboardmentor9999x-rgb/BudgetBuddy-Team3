from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationOut
from app.crud import notification as notification_crud


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# ==========================================================
# GET ALL NOTIFICATIONS
# ==========================================================

@router.get(
    "/",
    response_model=list[NotificationOut]
)
def get_notifications(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return notification_crud.get_notifications_by_user(
        db,
        current_user.id,
        skip,
        limit
    )


# ==========================================================
# GENERATE MONTHLY REPORT NOTIFICATION
# ==========================================================

@router.post(
    "/generate-monthly-report",
    response_model=NotificationOut,
    status_code=status.HTTP_201_CREATED
)
def generate_monthly_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return notification_crud.create_monthly_report_notification(
        db,
        current_user.id
    )


# ==========================================================
# MARK NOTIFICATION AS READ
# ==========================================================

@router.patch(
    "/{notification_id}/read",
    response_model=NotificationOut
)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = notification_crud.mark_notification_as_read(
        db,
        notification_id,
        current_user.id
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    return notification