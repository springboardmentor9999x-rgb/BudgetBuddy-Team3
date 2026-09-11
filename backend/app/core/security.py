from datetime import datetime, timedelta
import os
import secrets

from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User


# ==========================================================
# PASSWORD HASHING
# ==========================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ==========================================================
# JWT CONFIGURATION
# ==========================================================

SECRET_KEY = os.getenv("SECRET_KEY")

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        60
    )
)


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


# ==========================================================
# PASSWORD FUNCTIONS
# ==========================================================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain: str,
    hashed: str
) -> bool:
    return pwd_context.verify(
        plain,
        hashed
    )


# ==========================================================
# JWT ACCESS TOKEN
# ==========================================================

def create_access_token(
    data: dict,
    expires_delta: timedelta = None
):
    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta
        or timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    to_encode.update({
        "exp": expire
    })

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# ==========================================================
# GET CURRENT USER
# ==========================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        },
    )

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        if email is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if user is None:
        raise credentials_exception

    return user


# ==========================================================
# SECURE RANDOM TOKEN
# ==========================================================

def generate_secure_token(
    length: int = 32
) -> str:
    """
    Generate a cryptographically secure
    random token.
    """

    return secrets.token_urlsafe(length)


# ==========================================================
# EMAIL VERIFICATION TOKEN
# ==========================================================

def create_verification_token() -> str:
    """
    Create a secure token for email verification.
    """

    return generate_secure_token(32)


# ==========================================================
# PASSWORD RESET TOKEN
# ==========================================================

def create_reset_token() -> str:
    """
    Create a secure token for password reset.
    """

    return generate_secure_token(32)