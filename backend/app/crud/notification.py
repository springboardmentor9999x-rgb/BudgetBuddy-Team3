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
        f"Income \u20b9{total_income:.2f}, "
        f"Expenses \u20b9{total_expense:.2f}, "
        f"Balance \u20b9{balance:.2f}"
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