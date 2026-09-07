from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.database import get_db
from app.models.user import User

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    oauth2_scheme,
    SECRET_KEY,
    ALGORITHM
)


# ==========================================
# ROUTER
# ==========================================

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ==========================================
# REGISTER REQUEST SCHEMA
# ==========================================

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


# ==========================================
# REGISTER API
# ==========================================

@router.post("/register")
def register_user(
    user: RegisterRequest,
    db: Session = Depends(get_db)
):

    # Check if email already exists
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash password
    hashed_password = hash_password(
        user.password
    )

    # Create new user (default role = USER)
    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role="USER"
    )

    # Save user to database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user_id": new_user.user_id,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role
    }


# ==========================================
# LOGIN API
# ==========================================

@router.post("/login")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    # Find user using email
    existing_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    # Check if user exists
    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Verify password
    password_correct = verify_password(
        form_data.password,
        existing_user.password
    )

    # Check password
    if not password_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Create JWT token (includes role for frontend role-based UI)
    access_token = create_access_token(
        data={
            "sub": str(existing_user.user_id),
            "email": existing_user.email,
            "role": existing_user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": existing_user.role
    }


# ==========================================
# GET CURRENT USER FROM JWT
# ==========================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    # Error response
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    try:

        # Decode JWT token
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        # Get user ID from JWT
        user_id = payload.get("sub")

        # Check user ID
        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # Find user in database
    user = db.query(User).filter(
        User.user_id == int(user_id)
    ).first()

    # Check if user exists
    if user is None:
        raise credentials_exception

    return user


# ==========================================
# ROLE-BASED DEPENDENCY FUNCTIONS
# ==========================================

def require_premium_or_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency: only PREMIUM_USER or ADMIN can pass.
    Raises 403 for regular USER role.
    """
    if current_user.role not in ("PREMIUM_USER", "ADMIN"):
        raise HTTPException(
            status_code=403,
            detail="This feature requires a Premium or Admin account. Upgrade to Premium to access advanced analytics."
        )
    return current_user


def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency: only ADMIN can pass.
    Raises 403 for USER and PREMIUM_USER roles.
    """
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Admin privileges required."
        )
    return current_user


# ==========================================
# GET MY PROFILE
# ==========================================

@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user)
):

    return {
        "user_id": current_user.user_id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }