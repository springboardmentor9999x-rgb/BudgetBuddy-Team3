from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.models.user import User
from app.database import get_db

from app.schemas.user import (
    UserCreate,
    UserOut,
    UserNameUpdate,
    Token,
)

from app.crud.user import (
    get_user_by_email,
    create_user,
)

from app.core.security import (
    verify_password,
    create_access_token,
)


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

    # Check if email already exists

    if get_user_by_email(
        db,
        user_in.email
    ):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create user

    user = create_user(
        db=db,
        email=user_in.email,
        password=user_in.password,
        full_name=user_in.full_name,
        phone=user_in.phone
    )

    return user


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
            status_code=401,
            detail="Invalid credentials"
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
    current_user: User = Depends(
        get_current_user
    )
):

    return current_user


# ==========================================================
# UPDATE NAME ONLY
# ==========================================================

@router.put(
    "/me/name",
    response_model=UserOut
)
def update_my_name(
    name_data: UserNameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    # Validate name

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

    # Update ONLY name

    current_user.full_name = new_name

    db.commit()
    db.refresh(current_user)

    return current_user