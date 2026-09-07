from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.models.user import User
from app.models.premium_request import PremiumRequest
from app.models.notification import Notification
from app.models.account import Account
from app.models.category import Category
from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.financial_goal import FinancialGoal
from app.models.goal_contribution import GoalContribution
from app.routers.auth import require_admin


router = APIRouter(
    prefix="/admin",
    tags=["Admin User Management"]
)


class RoleUpdateRequest(BaseModel):
    role: str = Field(..., description="USER | PREMIUM_USER | ADMIN")


# ==========================================
# ADMIN: GET ALL USERS WITH REQUEST STATUS
# ==========================================
@router.get("/users")
def get_all_users_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Returns list of all users, their roles, and their latest upgrade request status.
    Admin only.
    """
    users = db.query(User).order_by(User.user_id.asc()).all()

    # Get latest request per user
    all_requests = (
        db.query(PremiumRequest)
        .order_by(PremiumRequest.requested_at.desc())
        .all()
    )
    user_requests_map = {}
    for r in all_requests:
        if r.user_id not in user_requests_map:
            user_requests_map[r.user_id] = r

    result = []
    for u in users:
        req = user_requests_map.get(u.user_id)
        result.append({
            "user_id": u.user_id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "premium_request": {
                "request_id": req.request_id,
                "status": req.status,
                "requested_at": req.requested_at,
                "processed_at": req.processed_at,
                "processed_by": req.processed_by
            } if req else None
        })

    return result


# ==========================================
# ADMIN: GET ALL PREMIUM REQUESTS
# ==========================================
@router.get("/premium-requests")
def get_premium_requests_admin(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Returns all premium upgrade requests with requester details.
    Admin only.
    """
    query = db.query(PremiumRequest).order_by(PremiumRequest.requested_at.desc())
    if status_filter:
        query = query.filter(PremiumRequest.status == status_filter.upper())

    requests = query.all()

    result = []
    for r in requests:
        u = db.query(User).filter(User.user_id == r.user_id).first()
        proc = db.query(User).filter(User.user_id == r.processed_by).first() if r.processed_by else None
        result.append({
            "request_id": r.request_id,
            "user_id": r.user_id,
            "user_name": u.name if u else "Unknown",
            "user_email": u.email if u else "-",
            "current_role": u.role if u else "USER",
            "status": r.status,
            "requested_at": r.requested_at,
            "processed_at": r.processed_at,
            "processed_by": proc.name if proc else None
        })

    return result


# ==========================================
# ADMIN: APPROVE PREMIUM UPGRADE REQUEST
# ==========================================
@router.post("/premium-requests/{request_id}/approve")
def approve_premium_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Approve a pending Premium upgrade request.
    Promotes user to PREMIUM_USER and sends an in-app notification.
    """
    req = db.query(PremiumRequest).filter(PremiumRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Premium upgrade request not found.")

    if req.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve request with status '{req.status}'."
        )

    target_user = db.query(User).filter(User.user_id == req.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Requester user account not found.")

    # 1. Update user role
    target_user.role = "PREMIUM_USER"

    # 2. Update request status
    req.status = "APPROVED"
    req.processed_at = datetime.utcnow()
    req.processed_by = current_user.user_id

    # 3. Create user in-app notification
    user_notif = Notification(
        user_id=target_user.user_id,
        title="Premium Upgrade Approved 🎉",
        message="Your Premium Upgrade Request has been approved! You now have full access to Advanced Analytics and Premium features.",
        action_url="/analytics",
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(user_notif)

    db.commit()
    db.refresh(req)
    db.refresh(target_user)

    return {
        "message": f"Successfully approved Premium Upgrade for {target_user.name}.",
        "request_id": req.request_id,
        "user_id": target_user.user_id,
        "new_role": target_user.role,
        "status": req.status
    }


# ==========================================
# ADMIN: REJECT PREMIUM UPGRADE REQUEST
# ==========================================
@router.post("/premium-requests/{request_id}/reject")
def reject_premium_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Reject a pending Premium upgrade request.
    Keeps user as USER and notifies them.
    """
    req = db.query(PremiumRequest).filter(PremiumRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Premium upgrade request not found.")

    if req.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject request with status '{req.status}'."
        )

    target_user = db.query(User).filter(User.user_id == req.user_id).first()

    # 1. Update request status
    req.status = "REJECTED"
    req.processed_at = datetime.utcnow()
    req.processed_by = current_user.user_id

    # 2. Create user notification
    if target_user:
        user_notif = Notification(
            user_id=target_user.user_id,
            title="Premium Upgrade Request Update",
            message="Your request for a Premium account upgrade could not be approved at this time. You may submit a new request later.",
            action_url="/profile",
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(user_notif)

    db.commit()
    db.refresh(req)

    return {
        "message": f"Premium Upgrade request #{req.request_id} has been rejected.",
        "request_id": req.request_id,
        "status": req.status
    }


# ==========================================
# ADMIN: DIRECT SET USER ROLE
# ==========================================
@router.put("/users/{user_id}/role")
def set_user_role_admin(
    user_id: int,
    body: RoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin direct role management for any user account.
    """
    allowed_roles = {"USER", "PREMIUM_USER", "ADMIN"}
    if body.role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {', '.join(allowed_roles)}"
        )

    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    old_role = target_user.role
    target_user.role = body.role
    db.commit()
    db.refresh(target_user)

    return {
        "message": f"Role updated from {old_role} to {target_user.role} for {target_user.name}.",
        "user_id": target_user.user_id,
        "old_role": old_role,
        "new_role": target_user.role
    }


# ==========================================
# ADMIN: DELETE USER ACCOUNT
# ==========================================
@router.delete("/users/{user_id}")
def delete_user_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Secure admin-only endpoint to delete a USER or PREMIUM_USER account.
    - Protected by require_admin (401 if unauthenticated, 403 if non-admin)
    - Prevents deletion of any ADMIN account
    - Prevents admins from deleting their own account
    - Safely cascades deletion of related financial and user records for this user only
    """
    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    # Prevent an admin from deleting their own account
    if target_user.user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot delete their own account."
        )

    # Prevent deletion of any ADMIN account
    if target_user.role == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete an administrator account."
        )

    try:
        # Safely remove all related database records for this user in foreign-key dependency order
        
        # 1. Goal Contributions (user's deposits and deposits into user's goals)
        user_goal_ids = [
            g.goal_id for g in db.query(FinancialGoal.goal_id).filter(FinancialGoal.user_id == target_user.user_id).all()
        ]
        if user_goal_ids:
            db.query(GoalContribution).filter(GoalContribution.goal_id.in_(user_goal_ids)).delete(synchronize_session=False)
        db.query(GoalContribution).filter(GoalContribution.user_id == target_user.user_id).delete(synchronize_session=False)

        # 2. Financial Goals
        db.query(FinancialGoal).filter(FinancialGoal.user_id == target_user.user_id).delete(synchronize_session=False)

        # 3. Expenses
        db.query(Expense).filter(Expense.user_id == target_user.user_id).delete(synchronize_session=False)

        # 4. Incomes
        db.query(Income).filter(Income.user_id == target_user.user_id).delete(synchronize_session=False)

        # 5. Budgets
        db.query(Budget).filter(Budget.user_id == target_user.user_id).delete(synchronize_session=False)

        # 6. Categories
        db.query(Category).filter(Category.user_id == target_user.user_id).delete(synchronize_session=False)

        # 7. Accounts
        db.query(Account).filter(Account.user_id == target_user.user_id).delete(synchronize_session=False)

        # 8. Notifications
        db.query(Notification).filter(Notification.user_id == target_user.user_id).delete(synchronize_session=False)

        # 9. Premium Requests
        db.query(PremiumRequest).filter(PremiumRequest.user_id == target_user.user_id).delete(synchronize_session=False)
        db.query(PremiumRequest).filter(PremiumRequest.processed_by == target_user.user_id).update(
            {"processed_by": None},
            synchronize_session=False
        )

        # 10. Delete user record
        user_name = target_user.name
        db.delete(target_user)
        db.commit()

        return {
            "message": f"User '{user_name}' has been successfully deleted.",
            "user_id": user_id
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )

