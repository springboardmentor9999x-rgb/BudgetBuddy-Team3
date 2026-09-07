import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# ==========================================================
# MAKE BACKEND DIRECTORY IMPORTABLE
# ==========================================================

BACKEND_DIR = Path(__file__).resolve().parents[1]

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


# ==========================================================
# FORCE TEST ENVIRONMENT
#
# IMPORTANT:
# Tests must NEVER use the development DATABASE_URL.
# ==========================================================

os.environ["BUDGETBUDDY_TESTING"] = "1"


# ==========================================================
# IMPORT APPLICATION AFTER TEST MODE IS SET
# ==========================================================

from app.database import Base, get_db
from app.main import app

# Import all models so SQLAlchemy knows about every table
# before Base.metadata.create_all() is called.
from app.models import (
    User,
    Profile,
    Income,
    Expense,
    Budget,
    BankAccount,
    SavingsGoal,
    Notification,
)


# ==========================================================
# TEST DATABASE
#
# SQLite is used ONLY for automated tests.
#
# This database is completely separate from the PostgreSQL
# development database.
# ==========================================================

TEST_DATABASE_URL = "sqlite://"


engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={
        "check_same_thread": False
    },
    poolclass=StaticPool,
)


TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ==========================================================
# TEST DATABASE FIXTURE
#
# A fresh database schema is created for every test.
# After the test, all tables are removed.
# ==========================================================

@pytest.fixture()
def db_session():
    Base.metadata.create_all(
        bind=engine
    )

    db = TestingSessionLocal()

    try:
        yield db

    finally:
        db.close()

        Base.metadata.drop_all(
            bind=engine
        )


# ==========================================================
# FASTAPI DATABASE OVERRIDE
# ==========================================================

@pytest.fixture()
def client(db_session):

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[
        get_db
    ] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


# ==========================================================
# BASIC TEST USER DATA
#
# These fixtures will be used by later test files.
# ==========================================================

@pytest.fixture()
def basic_user(db_session):
    from app.core.security import hash_password

    user = User(
        email="basic@test.com",
        hashed_password=hash_password(
            "Test@123"
        ),
        full_name="Basic Test User",
        phone="9876543210",
        role="user",
        is_active=True,
        is_verified=True,
        trial_used=False,
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    return user


@pytest.fixture()
def premium_user(db_session):
    from app.core.security import hash_password

    user = User(
        email="premium@test.com",
        hashed_password=hash_password(
            "Test@123"
        ),
        full_name="Premium Test User",
        phone="9876543211",
        role="premium",
        is_active=True,
        is_verified=True,
        trial_used=True,
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    return user


@pytest.fixture()
def admin_user(db_session):
    from app.core.security import hash_password

    user = User(
        email="admin@test.com",
        hashed_password=hash_password(
            "Test@123"
        ),
        full_name="Admin Test User",
        phone="9876543212",
        role="admin",
        is_active=True,
        is_verified=True,
        trial_used=True,
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    return user