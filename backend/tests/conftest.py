"""
BudgetBuddy — pytest conftest.py
=================================
Central test fixtures that provide a fully isolated test environment.

Strategy:
  - Uses an in-process SQLite file database (budget_buddy_test.db) that is
    created fresh at the start of every test session and wiped clean after
    every individual test function via a transaction rollback.
  - The FastAPI app's `get_db` dependency is overridden so EVERY request
    made through the TestClient uses the isolated test Session — never the
    live PostgreSQL personal_budget_db.
  - No network socket is opened; FastAPI TestClient runs entirely in-process.

GUARANTEE: The live database (personal_budget_db) is never contacted
during any pytest run.
"""

import os
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# ── The test DB lives in the backend directory and is .gitignored ────────────
TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "budget_buddy_test.db")
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

# ── Import the app AFTER we know which DB we want (env override) ─────────────
# We import the app here; the dependency override happens before any request.
from app.main import app
from app.database import Base, get_db


# ============================================================
# SESSION-SCOPED ENGINE — created once for the whole test run
# ============================================================

@pytest.fixture(scope="session")
def test_engine():
    """
    SQLite engine used for the entire test session.
    check_same_thread=False is required for SQLite + FastAPI TestClient.
    StaticPool ensures the in-memory/file connection is reused.
    """
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Create all tables from the SQLAlchemy models (mirrors production schema)
    Base.metadata.create_all(bind=engine)
    yield engine
    # After the whole session: drop all tables and remove the file
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


# ============================================================
# FUNCTION-SCOPED CONNECTION — wraps each test in a transaction
# ============================================================

@pytest.fixture()
def db_session(test_engine):
    """
    Provides a SQLAlchemy Session for each test, wrapped in a transaction
    that is rolled back after the test completes. This guarantees a clean
    slate for every test function without recreating the schema.
    """
    connection = test_engine.connect()
    transaction = connection.begin()
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=connection
    )
    session = TestingSessionLocal()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


# ============================================================
# FASTAPI TEST CLIENT — dependency override injected here
# ============================================================

@pytest.fixture()
def client(db_session):
    """
    Returns a FastAPI TestClient whose `get_db` dependency is overridden
    to use the isolated test Session instead of the live PostgreSQL DB.

    All HTTP calls made through this client go through the FastAPI app
    in-process — no real HTTP server, no network socket.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass  # rollback is handled by the db_session fixture

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ============================================================
# CONVENIENCE FIXTURE — registered test user + auth token
# ============================================================

@pytest.fixture()
def auth_headers(client):
    """
    Registers a fresh test user and returns Bearer headers.
    Because every test uses a rolled-back transaction, this user
    never persists across tests.
    """
    import time
    ts = int(time.time() * 1000)
    email = f"testuser_{ts}@test.local"
    password = "TestPass123!"

    reg = client.post("/auth/register", json={
        "name": "Test User",
        "email": email,
        "password": password,
    })
    assert reg.status_code in (200, 201), f"Registration failed: {reg.text}"

    login = client.post(
        "/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, f"Login failed: {login.text}"
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ============================================================
# ADMIN USER FIXTURE — for admin-only endpoint tests
# ============================================================

@pytest.fixture()
def admin_headers(client, db_session):
    """
    Creates an ADMIN user in the test DB and returns Bearer headers.
    The admin role is set directly in the DB (same way the real app does it).
    """
    import time
    from app.models.user import User
    from app.core.security import hash_password

    ts = int(time.time() * 1000)
    email = f"admin_{ts}@test.local"
    password = "AdminPass123!"

    admin_user = User(
        name="Test Admin",
        email=email,
        password=hash_password(password),
        role="ADMIN",
    )
    db_session.add(admin_user)
    db_session.commit()

    login = client.post(
        "/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, f"Admin login failed: {login.text}"
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
