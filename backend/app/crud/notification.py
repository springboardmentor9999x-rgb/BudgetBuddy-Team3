from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.income import Income
from app.models.expense import Expense


# ==========================================================
# CREATE NOTIFICATION
# ==========================================================

def create_notification(
    db: Session,
    user_id: int,
    message: str,
    notification_type: str
):
    """
    Create a notification.

    created_at is stored as UTC.
    """

    notification = Notification(
        user_id=user_id,
        message=message,
        type=notification_type,
        is_read=False,
        created_at=datetime.utcnow()
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


# ==========================================================
# GET ALL NOTIFICATIONS FOR USER
# ==========================================================

def get_notifications_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100
):
    return (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==========================================================
# GET SINGLE NOTIFICATION
# ==========================================================

def get_notification(
    db: Session,
    notification_id: int,
    user_id: int
):
    return (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        )
        .first()
    )


# ==========================================================
# MARK NOTIFICATION AS READ
# ==========================================================

def mark_notification_as_read(
    db: Session,
    notification_id: int,
    user_id: int
):
    notification = get_notification(
        db,
        notification_id,
        user_id
    )

    if not notification:
        return None

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification


# ==========================================================
# GENERATE MONTHLY REPORT NOTIFICATION
# ==========================================================

def create_monthly_report_notification(
    db: Session,
    user_id: int
):
    # ------------------------------------------------------
    # CURRENT UTC TIME
    # ------------------------------------------------------

    now = datetime.utcnow()

    # ------------------------------------------------------
    # FIRST DAY OF CURRENT MONTH
    # ------------------------------------------------------

    month_start = now.replace(
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )

    # ------------------------------------------------------
    # TOTAL INCOME
    # ------------------------------------------------------

    total_income = (
        db.query(
            func.coalesce(
                func.sum(Income.amount),
                0
            )
        )
        .filter(
            Income.user_id == user_id,
            Income.date >= month_start
        )
        .scalar()
    )

    # ------------------------------------------------------
    # TOTAL EXPENSE
    # ------------------------------------------------------

    total_expense = (
        db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0
            )
        )
        .filter(
            Expense.user_id == user_id,
            Expense.date >= month_start
        )
        .scalar()
    )

    total_income = float(
        total_income or 0
    )

    total_expense = float(
        total_expense or 0
    )

    # ------------------------------------------------------
    # BALANCE
    # ------------------------------------------------------

    balance = (
        total_income -
        total_expense
    )

    # ------------------------------------------------------
    # MESSAGE
    # ------------------------------------------------------

    message = (
        f"Monthly Report: "
        f"Income ₹{total_income:.2f}, "
        f"Expenses ₹{total_expense:.2f}, "
        f"Balance ₹{balance:.2f}"
    )

    # ------------------------------------------------------
    # CREATE NOTIFICATION
    # ------------------------------------------------------

    notification = Notification(
        user_id=user_id,
        message=message,
        type="monthly_report",
        is_read=False,
        created_at=datetime.utcnow()
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


# ==========================================================
# CREATE PREMIUM REQUEST NOTIFICATION FOR ADMIN
# ==========================================================

def create_premium_request_notification(
    db: Session,
    user_id: int
):
    """
    Create an in-app notification for the existing Admin account
    when a Basic User requests Premium access.

    This reuses the existing Notification table and stores only the
    minimal structured request metadata needed by Admin User Management.
    """

    # ------------------------------------------------------
    # IMPORT USER HERE TO AVOID MODEL IMPORT CYCLES
    # ------------------------------------------------------

    from app.models.user import User

    # ------------------------------------------------------
    # FIND ADMIN ACCOUNT
    # ------------------------------------------------------

    admin_user = (
        db.query(User)
        .filter(
            User.role == "admin",
            User.is_active == True
        )
        .first()
    )

    if not admin_user:
        return None

    # ------------------------------------------------------
    # GET REQUESTING USER
    # ------------------------------------------------------

    requesting_user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not requesting_user:
        return None

    # ------------------------------------------------------
    # PREVENT DUPLICATE PENDING REQUESTS
    # ------------------------------------------------------

    existing_request = (
        db.query(Notification)
        .filter(
            Notification.user_id == admin_user.id,
            Notification.type == "premium_request",
            Notification.requester_id == requesting_user.id,
            Notification.request_status == "pending",
        )
        .first()
    )

    if existing_request:
        return existing_request

    # ------------------------------------------------------
    # REQUEST MESSAGE
    # ------------------------------------------------------

    message = (
        "Premium subscription request received. "
        f"User ID: {requesting_user.id}, "
        f"Name: {requesting_user.full_name or 'N/A'}, "
        f"Email: {requesting_user.email}"
    )

    # ------------------------------------------------------
    # CREATE ADMIN NOTIFICATION
    # ------------------------------------------------------

    notification = Notification(
        user_id=admin_user.id,
        message=message,
        type="premium_request",
        is_read=False,
        requester_id=requesting_user.id,
        request_status="pending",
        created_at=datetime.utcnow()
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification