from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User

from app.schemas.user import (
    UserCreate,
    UserOut,
    UserNameUpdate,
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

            # FRONTEND VERIFICATION PAGE
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

        # Remove newly-created user if email failed
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

    # ------------------------------------------------------
    # FIND USER
    # ------------------------------------------------------

    user = get_user_by_email(
        db,
        request.email
    )

    # ------------------------------------------------------
    # DON'T REVEAL ACCOUNT INFORMATION
    # ------------------------------------------------------

    if not user:

        return {
            "message": (
                "If the email exists and is not verified, "
                "a verification email has been sent."
            )
        }

    # ------------------------------------------------------
    # ALREADY VERIFIED
    # ------------------------------------------------------

    if user.is_verified:

        return {
            "message": "Email is already verified. You can login."
        }

    # ------------------------------------------------------
    # CREATE NEW VERIFICATION TOKEN
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
    # CREATE EMAIL
    # ------------------------------------------------------

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

        # Remove the newly-created token if email failed
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

    # ------------------------------------------------------
    # FIND USER
    # ------------------------------------------------------

    user = get_user_by_email(
        db,
        form_data.username
    )

    # ------------------------------------------------------
    # CHECK CREDENTIALS
    # ------------------------------------------------------

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

    # ------------------------------------------------------
    # CHECK ACCOUNT STATUS
    # ------------------------------------------------------

    if not user.is_active:

        raise HTTPException(
            status_code=403,
            detail="Account is inactive"
        )

    # ------------------------------------------------------
    # CHECK EMAIL VERIFICATION
    # ------------------------------------------------------

    if not user.is_verified:

        raise HTTPException(
            status_code=403,
            detail="Please verify your email before logging in"
        )

    # ------------------------------------------------------
    # CREATE ACCESS TOKEN
    # ------------------------------------------------------

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

    # ------------------------------------------------------
    # FIND USER
    # ------------------------------------------------------

    user = get_user_by_email(
        db,
        request.email
    )

    # ------------------------------------------------------
    # DON'T REVEAL WHETHER EMAIL EXISTS
    # ------------------------------------------------------

    if not user:

        return {
            "message": (
                "If the email exists, "
                "a password reset link has been sent."
            )
        }

    # ------------------------------------------------------
    # CREATE RESET TOKEN
    # ------------------------------------------------------

    reset_token = create_reset_token(
        db=db,
        user=user
    )

    # ------------------------------------------------------
    # CREATE FRONTEND RESET LINK
    # ------------------------------------------------------

    reset_link = (
        "http://localhost:5173/reset-password"
        f"?token={reset_token}"
    )

    # ------------------------------------------------------
    # CREATE EMAIL
    # ------------------------------------------------------

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

        user.reset_token = None
        user.reset_token_expires = None

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Unable to send password reset email: {str(e)}"
        )

    # ------------------------------------------------------
    # DON'T RETURN TOKEN
    # ------------------------------------------------------

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

    # ------------------------------------------------------
    # FIND USER USING RESET TOKEN
    # ------------------------------------------------------

    user = get_user_by_reset_token(
        db=db,
        token=request.token
    )

    if not user:

        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )

    # ------------------------------------------------------
    # RESET PASSWORD
    # ------------------------------------------------------

    reset_password(
        db=db,
        user=user,
        new_password=request.new_password
    )

    return {
        "message": "Password reset successfully"
    }