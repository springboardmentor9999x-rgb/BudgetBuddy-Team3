from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.notification import Notification


def get_users(
    db: Session,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
):
    query = db.query(User)

    if search:
        search_value = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.email.ilike(search_value),
                User.full_name.ilike(search_value),
                User.phone.ilike(search_value),
            )
        )

    # Admin always appears first among the matching users.
    # The existing search filtering remains unchanged.
    return (
        query.order_by(
            (User.role == "admin").desc(),
            User.id.desc(),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def update_user_role(
    db: Session,
    user_id: int,
    role: str,
):
    user = get_user(db, user_id)

    if not user:
        return None

    user.role = role

    db.commit()
    db.refresh(user)

    return user


# ==========================================================
# PREMIUM REQUEST HELPERS
# ==========================================================

def _extract_requester_id_from_message(message):
    """
    Recover the requester ID from the existing Premium request
    notification format.

    Existing notifications use messages such as:

        Premium subscription request received.
        User ID: 16, Name: harish, Email: example@gmail.com
    """

    if not message:
        return None

    marker = "User ID:"

    if marker not in message:
        return None

    try:
        value = message.split(marker, 1)[1].strip()
        value = value.split(",", 1)[0].strip()

        return int(value)

    except (ValueError, TypeError):
        return None


def _get_active_admin(db: Session):
    """
    Dynamically find the active Admin account.

    This avoids hard-coding an Admin user ID.
    """

    return (
        db.query(User)
        .filter(
            User.role == "admin",
            User.is_active.is_(True),
        )
        .first()
    )


def get_premium_request_statuses(
    db: Session,
    users,
):
    """
    Return the latest Premium request status for each listed user.

    Supports both:

    1. New structured Premium requests:
       requester_id + request_status

    2. Existing older Premium request notifications:
       message containing User ID + unread state

    This keeps existing notification data working.
    """

    user_ids = [user.id for user in users]

    if not user_ids:
        return {}

    admin_user = _get_active_admin(db)

    if not admin_user:
        return {}

    requests = (
        db.query(Notification)
        .filter(
            Notification.user_id == admin_user.id,
            Notification.type == "premium_request",
        )
        .order_by(
            Notification.created_at.desc(),
            Notification.id.desc(),
        )
        .all()
    )

    statuses = {}

    for request in requests:

        requester_id = request.requester_id

        # --------------------------------------------------
        # Backward compatibility for older notifications
        # --------------------------------------------------

        if requester_id is None:
            requester_id = _extract_requester_id_from_message(
                request.message
            )

        if requester_id is None:
            continue

        if requester_id not in user_ids:
            continue

        # --------------------------------------------------
        # New structured request
        # --------------------------------------------------

        if request.request_status:
            if requester_id not in statuses:
                statuses[requester_id] = request.request_status

            continue

        # --------------------------------------------------
        # Older notification:
        #
        # An unread Premium request is treated as pending.
        #
        # Once an old notification is read, we cannot safely
        # determine whether it was approved or rejected.
        # --------------------------------------------------

        if request.is_read is False:
            if requester_id not in statuses:
                statuses[requester_id] = "pending"

    return statuses


def get_pending_premium_request(
    db: Session,
    user_id: int,
):
    """
    Find the latest pending Premium request belonging to the
    specified user.

    Supports both new structured requests and older unread
    Premium request notifications.
    """

    admin_user = _get_active_admin(db)

    if not admin_user:
        return None

    requests = (
        db.query(Notification)
        .filter(
            Notification.user_id == admin_user.id,
            Notification.type == "premium_request",
        )
        .order_by(
            Notification.created_at.desc(),
            Notification.id.desc(),
        )
        .with_for_update()
        .all()
    )

    for request in requests:

        requester_id = request.requester_id

        if requester_id is None:
            requester_id = _extract_requester_id_from_message(
                request.message
            )

        if requester_id != user_id:
            continue

        # New structured request
        if request.request_status == "pending":
            return request

        # Older unread Premium request
        if request.request_status is None and request.is_read is False:
            return request

    return None


def approve_premium_request(
    db: Session,
    user_id: int,
):
    """
    Approve a pending Premium request.

    Existing Premium trial logic is reused for users who have
    never consumed their trial.
    """

    target_user = (
        db.query(User)
        .filter(User.id == user_id)
        .with_for_update()
        .first()
    )

    if not target_user:
        return None, "User not found"

    if target_user.role == "admin":
        return target_user, "The Admin account cannot be modified"

    if target_user.role != "user":
        return (
            target_user,
            "Only Basic Users can have a pending Premium request approved",
        )

    request = get_pending_premium_request(
        db,
        user_id,
    )

    if not request:
        return (
            target_user,
            "No pending Premium request found for this user",
        )

    # ------------------------------------------------------
    # EXISTING FREE TRIAL LOGIC
    # ------------------------------------------------------

    if target_user.trial_used:

        # Trial was already consumed.
        # Administrator approval grants Premium without
        # resetting or extending the existing trial.
        target_user.role = "premium"
        target_user.cancellation_requested = False

    else:

        # Reuse the existing working Premium trial function.
        from app.crud.user import start_premium_trial

        target_user, activation_error = start_premium_trial(
            db=db,
            user=target_user,
        )

        if activation_error:
            return target_user, activation_error

    # ------------------------------------------------------
    # MARK REQUEST APPROVED
    # ------------------------------------------------------

    request.requester_id = user_id
    request.request_status = "approved"
    request.is_read = True

    db.commit()
    db.refresh(target_user)

    return target_user, None


def reject_premium_request(
    db: Session,
    user_id: int,
):
    """
    Reject a pending Premium request.

    User account information is not changed.
    """

    target_user = (
        db.query(User)
        .filter(User.id == user_id)
        .with_for_update()
        .first()
    )

    if not target_user:
        return None, "User not found"

    if target_user.role == "admin":
        return target_user, "The Admin account cannot be modified"

    request = get_pending_premium_request(
        db,
        user_id,
    )

    if not request:
        return (
            target_user,
            "No pending Premium request found for this user",
        )

    request.requester_id = user_id
    request.request_status = "rejected"
    request.is_read = True

    db.commit()
    db.refresh(target_user)

    return target_user, None


# ==========================================================
# SYSTEM ANALYTICS
# ==========================================================

def get_system_analytics(db: Session):

    total_users = (
        db.query(func.count(User.id))
        .scalar()
        or 0
    )

    basic_users = (
        db.query(func.count(User.id))
        .filter(User.role == "user")
        .scalar()
        or 0
    )

    premium_users = (
        db.query(func.count(User.id))
        .filter(User.role == "premium")
        .scalar()
        or 0
    )

    admin_users = (
        db.query(func.count(User.id))
        .filter(User.role == "admin")
        .scalar()
        or 0
    )

    active_users = (
        db.query(func.count(User.id))
        .filter(User.is_active.is_(True))
        .scalar()
        or 0
    )

    inactive_users = (
        db.query(func.count(User.id))
        .filter(User.is_active.is_(False))
        .scalar()
        or 0
    )

    trial_users = (
        db.query(func.count(User.id))
        .filter(
            User.premium_expires_at.isnot(None),
            User.premium_expires_at > datetime.now(timezone.utc),
        )
        .scalar()
        or 0
    )

    total_income = (
        db.query(
            func.coalesce(
                func.sum(Income.amount),
                0,
            )
        )
        .scalar()
        or 0
    )

    total_expenses = (
        db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0,
            )
        )
        .scalar()
        or 0
    )

    total_savings = (
        float(total_income)
        - float(total_expenses)
    )

    # ======================================================
    # MONTHLY USER REGISTRATIONS
    #
    # Build all 12 months so the frontend always receives
    # a complete current-year chart.
    # ======================================================

    now = datetime.now(timezone.utc)
    current_year = now.year

    monthly_counts = {
        month: 0
        for month in range(1, 13)
    }

    users = (
        db.query(User.created_at)
        .filter(User.created_at.isnot(None))
        .all()
    )

    for row in users:

        created_at = row[0]

        if created_at is None:
            continue

        if created_at.year != current_year:
            continue

        if 1 <= created_at.month <= 12:
            monthly_counts[created_at.month] += 1

    month_names = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ]

    monthly_registrations = [
        {
            "month": month_names[month - 1],
            "count": monthly_counts[month],
        }
        for month in range(1, 13)
    ]

    # ======================================================
    # PENDING PREMIUM REQUESTS
    # ======================================================

    pending_premium_requests = 0

    admin_user = _get_active_admin(db)

    if admin_user:

        requests = (
            db.query(Notification)
            .filter(
                Notification.user_id == admin_user.id,
                Notification.type == "premium_request",
            )
            .order_by(
                Notification.created_at.desc(),
                Notification.id.desc(),
            )
            .all()
        )

        processed_users = set()

        for request in requests:

            requester_id = request.requester_id

            if requester_id is None:
                requester_id = _extract_requester_id_from_message(
                    request.message
                )

            if requester_id is None:
                continue

            if requester_id in processed_users:
                continue

            if request.request_status == "pending":
                pending_premium_requests += 1
                processed_users.add(requester_id)

            elif (
                request.request_status is None
                and request.is_read is False
            ):
                # Backward-compatible pending request.
                pending_premium_requests += 1
                processed_users.add(requester_id)

            elif request.request_status in {
                "approved",
                "rejected",
            }:
                processed_users.add(requester_id)

    return {
        "total_users": total_users,
        "basic_users": basic_users,
        "premium_users": premium_users,
        "admin_users": admin_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "trial_users": trial_users,
        "total_income": float(total_income),
        "total_expenses": float(total_expenses),
        "total_savings": total_savings,
        "monthly_registrations": monthly_registrations,
        "pending_premium_requests": pending_premium_requests,
    }