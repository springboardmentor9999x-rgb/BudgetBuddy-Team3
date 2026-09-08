import os

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.profile import Profile
from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.bank_account import BankAccount
from app.models.savings_goal import SavingsGoal
from app.models.notification import Notification

from app.schemas.user import (
    UserCreate,
    UserOut,
    UserNameUpdate,
    UserProfileUpdate,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ResendVerificationRequest,
)

from app.crud.user import (
    get_user_by_email,
    create_user,
    create_verification_token,
    verify_email,
    create_reset_token,
    get_user_by_reset_token,
    reset_password,
    start_premium_trial,
    cancel_premium_trial,
    reactivate_premium_trial,
)

from app.crud.notification import (
    create_premium_request_notification,
)

from app.core.security import (
    verify_password,
    create_access_token,
)

from app.core.email import send_email


router = APIRouter()


# ==========================================================
# FRONTEND URL (used for email links)
# ==========================================================

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
)


# ==========================================================
# SIGNUP
# ==========================================================

@router.post(
    "/signup",
    response_model=UserOut
)
def signup(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):

    # ------------------------------------------------------
    # CHECK WHETHER EMAIL ALREADY EXISTS
    # ------------------------------------------------------

    existing_user = get_user_by_email(
        db,
        user_in.email
    )

    if existing_user:

        # --------------------------------------------------
        # EXISTING BUT NOT VERIFIED
        # --------------------------------------------------

        if not existing_user.is_verified:

            verification_token = create_verification_token(
                db=db,
                user=existing_user
            )

            verification_link = (
                f"{FRONTEND_URL}/verify-email"
                f"?token={verification_token}"
            )

            email_subject = (
                "Verify your BudgetBuddy account"
            )

            email_body = f"""
Hello {existing_user.full_name},

Welcome to BudgetBuddy!

Your BudgetBuddy account already exists but your email has not been verified yet.

Please verify your email by clicking the link below:

{verification_link}

Verification token:

{verification_token}

This verification link will expire in 24 hours.

If you did not create this account, please ignore this email.

Regards,
BudgetBuddy Team
"""

            try:

                send_email(
                    to_email=existing_user.email,
                    subject=email_subject,
                    body=email_body
                )

            except Exception as e:

                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Unable to send verification email: "
                        f"{str(e)}"
                    )
                )

            return existing_user

        # --------------------------------------------------
        # EXISTING AND VERIFIED
        # --------------------------------------------------

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # ------------------------------------------------------
    # CREATE NEW USER
    # ------------------------------------------------------

    user = create_user(
        db=db,
        email=user_in.email,
        password=user_in.password,
        full_name=user_in.full_name,
        phone=user_in.phone
    )

    # ------------------------------------------------------
    # CREATE VERIFICATION TOKEN
    # ------------------------------------------------------

    verification_token = create_verification_token(
        db=db,
        user=user
    )

    # ------------------------------------------------------
    # CREATE FRONTEND VERIFICATION LINK
    # ------------------------------------------------------

    verification_link = (
        f"{FRONTEND_URL}/verify-email"
        f"?token={verification_token}"
    )

    # ------------------------------------------------------
    # CREATE VERIFICATION EMAIL
    # ------------------------------------------------------

    email_subject = (
        "Verify your BudgetBuddy account"
    )

    email_body = f"""
Hello {user.full_name},

Welcome to BudgetBuddy!

Thank you for creating your account.

Please verify your email address by clicking the link below:

{verification_link}

Verification token:

{verification_token}

This verification link will expire in 24 hours.

If you did not create this account, please ignore this email.

Regards,
BudgetBuddy Team
"""

    # ------------------------------------------------------
    # SEND EMAIL
    # ------------------------------------------------------

    try:

        send_email(
            to_email=user.email,
            subject=email_subject,
            body=email_body
        )

    except Exception as e:

        db.delete(user)
        db.commit()

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to send verification email: "
                f"{str(e)}"
            )
        )

    return user


# ==========================================================
# RESEND VERIFICATION EMAIL
# ==========================================================

@router.post(
    "/resend-verification"
)
def resend_verification(
    request: ResendVerificationRequest,
    db: Session = Depends(get_db)
):

    user = get_user_by_email(
        db,
        request.email
    )

    if not user:

        return {
            "message": (
                "If the email exists and is not verified, "
                "a verification email has been sent."
            )
        }

    if user.is_verified:

        return {
            "message": (
                "Email is already verified. "
                "You can login."
            )
        }

    verification_token = create_verification_token(
        db=db,
        user=user
    )

    verification_link = (
        f"{FRONTEND_URL}/verify-email"
        f"?token={verification_token}"
    )

    email_subject = (
        "Verify your BudgetBuddy account"
    )

    email_body = f"""
Hello {user.full_name},

We received a request to verify your BudgetBuddy account.

Please verify your email address by clicking the link below:

{verification_link}

Verification token:

{verification_token}

This verification link will expire in 24 hours.

If you did not create this account, please ignore this email.

Regards,
BudgetBuddy Team
"""

    try:

        send_email(
            to_email=user.email,
            subject=email_subject,
            body=email_body
        )

    except Exception as e:

        user.verification_token = None
        user.verification_token_expires = None

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to send verification email: "
                f"{str(e)}"
            )
        )

    return {
        "message": (
            "If the email exists and is not verified, "
            "a verification email has been sent."
        )
    }


# ==========================================================
# LOGIN
# ==========================================================

@router.post(
    "/login",
    response_model=Token
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    user = get_user_by_email(
        db,
        form_data.username
    )

    if not user or not verify_password(
        form_data.password,
        user.hashed_password
    ):

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    if not user.is_active:

        raise HTTPException(
            status_code=403,
            detail="Account is inactive"
        )

    if not user.is_verified:

        raise HTTPException(
            status_code=403,
            detail=(
                "Please verify your email "
                "before logging in"
            )
        )

    token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# ==========================================================
# CURRENT USER
# ==========================================================

@router.get(
    "/me",
    response_model=UserOut
)
def read_me(
    current_user: User = Depends(get_current_user)
):

    return current_user


# ==========================================================
# REQUEST PREMIUM ACCESS
# ==========================================================
#
# Basic User:
#
#   Explore Premium
#          ↓
#   Request Premium
#          ↓
#   Admin Notification
#          ↓
#   Admin User Management
#          ↓
#   Admin changes role: user → premium
#
# IMPORTANT:
#
# - No payment gateway is used.
# - No frontend role change is trusted.
# - Only a Basic "user" account can submit the request.
# - Premium users cannot request Premium again.
# - Admin cannot request Premium.
# - The request is stored as an existing notification.
#
# ==========================================================

@router.post(
    "/request-premium"
)
def request_premium(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ------------------------------------------------------
    # ONLY BASIC USERS CAN REQUEST PREMIUM
    # ------------------------------------------------------

    if current_user.role != "user":

        if current_user.role == "premium":

            raise HTTPException(
                status_code=400,
                detail="Your account already has Premium access."
            )

        if current_user.role == "admin":

            raise HTTPException(
                status_code=400,
                detail="Admin account already has Premium-level access."
            )

        raise HTTPException(
            status_code=403,
            detail="Only Basic Users can request Premium access."
        )

    # ------------------------------------------------------
    # CREATE ADMIN NOTIFICATION
    # ------------------------------------------------------

    notification = create_premium_request_notification(
        db=db,
        user_id=current_user.id
    )

    # ------------------------------------------------------
    # NO ADMIN ACCOUNT FOUND
    # ------------------------------------------------------

    if notification is None:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to submit Premium request because "
                "no active Admin account was found."
            )
        )

    # ------------------------------------------------------
    # SUCCESS
    # ------------------------------------------------------

    return {
        "message": (
            "Premium request submitted successfully. "
            "The Admin has been notified."
        ),
        "request_id": notification.id
    }


# ==========================================================
# START PREMIUM TRIAL
# ==========================================================
#
# Activates a one-month free Premium trial for the current
# user, triggered from the "Explore Premium" upgrade modal.
#
# Eligibility (enforced server-side, not just in the UI):
#
#   - Only "user" role accounts may start a trial.
#   - Each account may only ever use the free trial once.
#
# ==========================================================

@router.post(
    "/start-trial",
    response_model=UserOut
)
def start_trial(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    updated_user, error = start_premium_trial(
        db=db,
        user=current_user
    )

    if error:

        raise HTTPException(
            status_code=400,
            detail=error
        )

    # ------------------------------------------------------
    # BEST-EFFORT CONFIRMATION EMAIL
    #
    # The trial is already active at this point, so a failed
    # email should never block the upgrade itself.
    # ------------------------------------------------------

    try:

        send_email(
            to_email=updated_user.email,
            subject="Your BudgetBuddy Premium trial has started",
            body=f"""
Hello {updated_user.full_name},

Your 1-month free Premium trial is now active.

You now have access to:

- Historical trends
- 6 and 12 month analytics
- Custom date ranges
- Month comparison
- Savings analytics
- PDF export
- Excel export
- Advanced insights

Your trial ends on {updated_user.premium_expires_at.strftime('%d %b %Y')}.

Regards,
BudgetBuddy Team
"""
        )

    except Exception as e:

        print(
            "Failed to send premium trial confirmation email:",
            str(e)
        )

    return updated_user


# ==========================================================
# CANCEL PREMIUM TRIAL (REVERSIBLE)
# ==========================================================
#
# Schedules cancellation of the current user's Premium plan,
# triggered from the "Cancel Premium" option in the Analytics
# page or the Profile page.
#
# This does NOT immediately revoke Premium access. The user
# keeps Premium until the original premium_expires_at date,
# and can undo this via POST /auth/reactivate-premium at any
# time before then.
#
# trial_used stays True, so cancelling does not grant a
# fresh free trial.
#
# ==========================================================

@router.post(
    "/cancel-premium",
    response_model=UserOut
)
def cancel_trial(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    updated_user, error = cancel_premium_trial(
        db=db,
        user=current_user
    )

    if error:

        raise HTTPException(
            status_code=400,
            detail=error
        )

    return updated_user


# ==========================================================
# REACTIVATE PREMIUM TRIAL (UNDO CANCELLATION)
# ==========================================================
#
# Reverses a scheduled cancellation, triggered from the
# "Reactivate Premium" option shown after a user cancels but
# their current Premium period hasn't ended yet.
#
# IMPORTANT:
#   - Does NOT start a new trial.
#   - Does NOT change premium_expires_at.
#   - Does NOT charge the user.
#
# If the original Premium period has already expired, this
# will fail — the user must use the Premium upgrade flow
# instead.
#
# ==========================================================

@router.post(
    "/reactivate-premium",
    response_model=UserOut
)
def reactivate_trial(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    updated_user, error = reactivate_premium_trial(
        db=db,
        user=current_user
    )

    if error:

        raise HTTPException(
            status_code=400,
            detail=error
        )

    return updated_user


# ==========================================================
# UPDATE NAME
# ==========================================================

@router.put(
    "/me/name",
    response_model=UserOut
)
def update_my_name(
    name_data: UserNameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    new_name = name_data.full_name.strip()

    if not new_name:

        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty"
        )

    if len(new_name) < 2:

        raise HTTPException(
            status_code=400,
            detail=(
                "Name must contain at least 2 characters"
            )
        )

    current_user.full_name = new_name

    db.commit()
    db.refresh(current_user)

    return current_user


# ==========================================================
# UPDATE PROFILE
# ==========================================================
#
# IMPORTANT SECURITY RULE:
#
# Users can update:
#
#   - full_name
#   - phone
#
# Users CANNOT update:
#
#   - role
#   - email
#   - is_active
#   - is_verified
#
# Role changes will be handled separately through
# administrator functionality.
#
# ==========================================================

@router.put(
    "/me/profile",
    response_model=UserOut
)
def update_my_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ------------------------------------------------------
    # VALIDATE FULL NAME
    # ------------------------------------------------------

    if profile_data.full_name is not None:

        new_name = profile_data.full_name.strip()

        if not new_name:

            raise HTTPException(
                status_code=400,
                detail="Name cannot be empty"
            )

        if len(new_name) < 2:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Name must contain at least "
                    "2 characters"
                )
            )

        current_user.full_name = new_name

    # ------------------------------------------------------
    # VALIDATE PHONE
    # ------------------------------------------------------

    if profile_data.phone is not None:

        new_phone = profile_data.phone.strip()

        if new_phone == "":

            current_user.phone = None

        elif not new_phone.isdigit():

            raise HTTPException(
                status_code=400,
                detail=(
                    "Phone number must contain "
                    "only digits"
                )
            )

        elif len(new_phone) != 10:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Phone number must contain "
                    "exactly 10 digits"
                )
            )

        else:

            current_user.phone = new_phone

    # ------------------------------------------------------
    # ROLE IS INTENTIONALLY NOT UPDATED
    # ------------------------------------------------------
    #
    # Do NOT accept role from the frontend.
    #
    # current_user.role remains unchanged.
    #
    # ------------------------------------------------------

    db.commit()
    db.refresh(current_user)

    return current_user


# ==========================================================
# VERIFY EMAIL
# ==========================================================

@router.get(
    "/verify-email"
)
def verify_user_email(
    token: str,
    db: Session = Depends(get_db)
):

    user = verify_email(
        db=db,
        token=token
    )

    if not user:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid or expired verification token"
            )
        )

    return {
        "message": (
            "Email verified successfully. "
            "You can now login."
        )
    }


# ==========================================================
# FORGOT PASSWORD
# ==========================================================

@router.post(
    "/forgot-password"
)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):

    user = get_user_by_email(
        db,
        request.email
    )

    if not user:

        return {
            "message": (
                "If the email exists, "
                "a password reset link has been sent."
            )
        }

    reset_token = create_reset_token(
        db=db,
        user=user
    )

    reset_link = (
        f"{FRONTEND_URL}/reset-password"
        f"?token={reset_token}"
    )

    email_subject = (
        "BudgetBuddy Password Reset"
    )

    email_body = f"""
Hello {user.full_name},

We received a request to reset your BudgetBuddy password.

Please click the link below to reset your password:

{reset_link}

Your password reset token is:

{reset_token}

This reset link will expire in 1 hour.

If you did not request a password reset, please ignore this email.

Regards,
BudgetBuddy Team
"""

    try:

        send_email(
            to_email=user.email,
            subject=email_subject,
            body=email_body
        )

    except Exception as e:

        user.reset_token = None
        user.reset_token_expires = None

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to send password reset email: "
                f"{str(e)}"
            )
        )

    return {
        "message": (
            "If the email exists, "
            "a password reset link has been sent."
        )
    }


# ==========================================================
# RESET PASSWORD
# ==========================================================

@router.post(
    "/reset-password"
)
def reset_user_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):

    user = get_user_by_reset_token(
        db=db,
        token=request.token
    )

    if not user:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid or expired reset token"
            )
        )

    reset_password(
        db=db,
        user=user,
        new_password=request.new_password
    )

    return {
        "message": "Password reset successfully"
    }


# ==========================================================
# DELETE CURRENT USER ACCOUNT
# ==========================================================
#
# This deletes ALL information belonging to the current user.
#
# Deletion order:
#
# 1. Profile
# 2. Income
# 3. Expense
# 4. Budget
# 5. Savings Goals
# 6. Notifications
# 7. Bank Accounts
# 8. User
#
# Savings goals must be deleted BEFORE bank accounts because
# savings_goals.bank_account_id references bank_accounts.id.
#
# ==========================================================

@router.delete(
    "/me"
)
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    user_id = current_user.id

    try:

        # --------------------------------------------------
        # DELETE PROFILE
        # --------------------------------------------------

        db.query(Profile).filter(
            Profile.user_id == user_id
        ).delete(
            synchronize_session=False
        )

        # --------------------------------------------------
        # DELETE INCOME
        # --------------------------------------------------

        db.query(Income).filter(
            Income.user_id == user_id
        ).delete(
            synchronize_session=False
        )

        # --------------------------------------------------
        # DELETE EXPENSES
        # --------------------------------------------------

        db.query(Expense).filter(
            Expense.user_id == user_id
        ).delete(
            synchronize_session=False
        )

        # --------------------------------------------------
        # DELETE BUDGETS
        # --------------------------------------------------

        db.query(Budget).filter(
            Budget.user_id == user_id
        ).delete(
            synchronize_session=False
        )

        # --------------------------------------------------
        # DELETE SAVINGS GOALS
        # --------------------------------------------------

        db.query(SavingsGoal).filter(
            SavingsGoal.user_id == user_id
        ).delete(
            synchronize_session=False
        )

        # --------------------------------------------------
        # DELETE NOTIFICATIONS
        # --------------------------------------------------

        db.query(Notification).filter(
            Notification.user_id == user_id
        ).delete(
            synchronize_session=False
        )

        # --------------------------------------------------
        # DELETE BANK ACCOUNTS
        # --------------------------------------------------

        db.query(BankAccount).filter(
            BankAccount.user_id == user_id
        ).delete(
            synchronize_session=False
        )

        # --------------------------------------------------
        # DELETE USER
        # --------------------------------------------------

        db.query(User).filter(
            User.id == user_id
        ).delete(
            synchronize_session=False
        )

        # --------------------------------------------------
        # COMMIT EVERYTHING
        # --------------------------------------------------

        db.commit()

        return {
            "message": (
                "Account and all associated data "
                "deleted successfully."
            )
        }

    except Exception as e:

        # --------------------------------------------------
        # ROLLBACK IF ANYTHING FAILS
        # --------------------------------------------------

        db.rollback()

        print(
            "Account deletion failed:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to delete account and "
                "associated data."
            )
        )