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
)

from app.core.security import (
    verify_password,
    create_access_token,
)

from app.core.email import send_email


router = APIRouter()


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
                "http://localhost:5173/verify-email"
                f"?token={verification_token}"
            )

            email_subject = "Verify your BudgetBuddy account"

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
                    detail=f"Unable to send verification email: {str(e)}"
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
        "http://localhost:5173/verify-email"
        f"?token={verification_token}"
    )

    # ------------------------------------------------------
    # CREATE VERIFICATION EMAIL
    # ------------------------------------------------------

    email_subject = "Verify your BudgetBuddy account"

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
            detail=f"Unable to send verification email: {str(e)}"
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
            "message": "Email is already verified. You can login."
        }

    verification_token = create_verification_token(
        db=db,
        user=user
    )

    verification_link = (
        "http://localhost:5173/verify-email"
        f"?token={verification_token}"
    )

    email_subject = "Verify your BudgetBuddy account"

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
            detail=f"Unable to send verification email: {str(e)}"
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
            detail="Please verify your email before logging in"
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
            detail="Name must contain at least 2 characters"
        )

    current_user.full_name = new_name

    db.commit()
    db.refresh(current_user)

    return current_user


# ==========================================================
# UPDATE PROFILE
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

    new_name = profile_data.full_name.strip()

    if not new_name:

        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty"
        )

    if len(new_name) < 2:

        raise HTTPException(
            status_code=400,
            detail="Name must contain at least 2 characters"
        )

    # ------------------------------------------------------
    # VALIDATE PHONE
    # ------------------------------------------------------

    new_phone = profile_data.phone

    if new_phone is not None:

        new_phone = new_phone.strip()

        if new_phone == "":
            new_phone = None

        elif not new_phone.isdigit():

            raise HTTPException(
                status_code=400,
                detail="Phone number must contain only digits"
            )

        elif len(new_phone) != 10:

            raise HTTPException(
                status_code=400,
                detail="Phone number must contain exactly 10 digits"
            )

    # ------------------------------------------------------
    # VALIDATE ROLE
    # ------------------------------------------------------

    new_role = profile_data.role.strip().lower()

    if not new_role:

        raise HTTPException(
            status_code=400,
            detail="Role cannot be empty"
        )

    # ------------------------------------------------------
    # UPDATE USER
    # ------------------------------------------------------

    current_user.full_name = new_name
    current_user.phone = new_phone
    current_user.role = new_role

    # ------------------------------------------------------
    # SAVE
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
            detail="Invalid or expired verification token"
        )

    return {
        "message": "Email verified successfully. You can now login."
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
        "http://localhost:5173/reset-password"
        f"?token={reset_token}"
    )

    email_subject = "BudgetBuddy Password Reset"

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
            detail=f"Unable to send password reset email: {str(e)}"
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
            detail="Invalid or expired reset token"
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
# IMPORTANT:
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

        # MUST happen before bank accounts because
        # savings_goals.bank_account_id references bank_accounts.id.

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
            "message": "Account and all associated data deleted successfully."
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
            detail="Failed to delete account and associated data."
        )