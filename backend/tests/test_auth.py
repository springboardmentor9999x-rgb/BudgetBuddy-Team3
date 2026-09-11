import pytest

from app.models.user import User


# ==========================================================
# SIGNUP
# ==========================================================

def test_signup_success(client, monkeypatch):
    """
    Verify that a new user can successfully register.
    """

    # Prevent the real email service from being called.
    monkeypatch.setattr(
        "app.routers.auth.send_email",
        lambda **kwargs: None
    )

    response = client.post(
        "/auth/signup",
        json={
            "email": "newuser@test.com",
            "password": "Test@123",
            "full_name": "New Test User",
            "phone": "9876543210",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["email"] == "newuser@test.com"
    assert data["full_name"] == "New Test User"
    assert data["role"] == "user"
    assert data["is_active"] is True
    assert data["is_verified"] is False


# ==========================================================
# DUPLICATE VERIFIED USER
# ==========================================================

def test_duplicate_signup(client, db_session, monkeypatch):
    """
    A verified user cannot register again with the same email.
    """

    monkeypatch.setattr(
        "app.routers.auth.send_email",
        lambda **kwargs: None
    )

    first_response = client.post(
        "/auth/signup",
        json={
            "email": "duplicate@test.com",
            "password": "Test@123",
            "full_name": "Duplicate User",
            "phone": "9876543210",
        },
    )

    assert first_response.status_code == 200

    user = (
        db_session.query(User)
        .filter(
            User.email == "duplicate@test.com"
        )
        .first()
    )

    assert user is not None

    # Simulate email verification.
    user.is_verified = True

    db_session.commit()

    second_response = client.post(
        "/auth/signup",
        json={
            "email": "duplicate@test.com",
            "password": "Test@123",
            "full_name": "Duplicate User",
            "phone": "9876543210",
        },
    )

    assert second_response.status_code == 400

    assert (
        second_response.json()["detail"]
        == "Email already registered"
    )


# ==========================================================
# LOGIN - VERIFIED USER
# ==========================================================

def test_login_success(
    client,
    db_session,
    monkeypatch
):
    """
    Verify that a verified user can log in
    and receive a JWT access token.
    """

    monkeypatch.setattr(
        "app.routers.auth.send_email",
        lambda **kwargs: None
    )

    signup_response = client.post(
        "/auth/signup",
        json={
            "email": "login@test.com",
            "password": "Test@123",
            "full_name": "Login Test User",
            "phone": "9876543210",
        },
    )

    assert signup_response.status_code == 200

    user = (
        db_session.query(User)
        .filter(
            User.email == "login@test.com"
        )
        .first()
    )

    assert user is not None

    # Login requires verified email.
    user.is_verified = True

    db_session.commit()

    response = client.post(
        "/auth/login",
        data={
            "username": "login@test.com",
            "password": "Test@123",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["access_token"]

    assert data["token_type"] == "bearer"


# ==========================================================
# LOGIN - INVALID PASSWORD
# ==========================================================

def test_login_invalid_password(
    client,
    db_session,
    monkeypatch
):
    """
    Invalid password must be rejected.
    """

    monkeypatch.setattr(
        "app.routers.auth.send_email",
        lambda **kwargs: None
    )

    client.post(
        "/auth/signup",
        json={
            "email": "wrongpassword@test.com",
            "password": "Test@123",
            "full_name": "Wrong Password User",
            "phone": "9876543210",
        },
    )

    user = (
        db_session.query(User)
        .filter(
            User.email == "wrongpassword@test.com"
        )
        .first()
    )

    assert user is not None

    user.is_verified = True

    db_session.commit()

    response = client.post(
        "/auth/login",
        data={
            "username": "wrongpassword@test.com",
            "password": "WrongPassword",
        },
    )

    assert response.status_code == 401

    assert (
        response.json()["detail"]
        == "Invalid credentials"
    )


# ==========================================================
# LOGIN - NON-EXISTING USER
# ==========================================================

def test_login_non_existing_user(client):
    """
    Login with an email that does not exist.
    """

    response = client.post(
        "/auth/login",
        data={
            "username": "doesnotexist@test.com",
            "password": "Test@123",
        },
    )

    assert response.status_code == 401

    assert (
        response.json()["detail"]
        == "Invalid credentials"
    )


# ==========================================================
# LOGIN - UNVERIFIED USER
# ==========================================================

def test_login_unverified_user(
    client,
    monkeypatch
):
    """
    An account that has not verified its email
    cannot log in.
    """

    monkeypatch.setattr(
        "app.routers.auth.send_email",
        lambda **kwargs: None
    )

    response = client.post(
        "/auth/signup",
        json={
            "email": "unverified@test.com",
            "password": "Test@123",
            "full_name": "Unverified User",
            "phone": "9876543210",
        },
    )

    assert response.status_code == 200

    login_response = client.post(
        "/auth/login",
        data={
            "username": "unverified@test.com",
            "password": "Test@123",
        },
    )

    assert login_response.status_code == 403

    assert (
        login_response.json()["detail"]
        == "Please verify your email before logging in"
    )


# ==========================================================
# LOGIN - INACTIVE USER
# ==========================================================

def test_login_inactive_user(
    client,
    db_session,
    monkeypatch
):
    """
    An inactive user cannot log in.
    """

    monkeypatch.setattr(
        "app.routers.auth.send_email",
        lambda **kwargs: None
    )

    client.post(
        "/auth/signup",
        json={
            "email": "inactive@test.com",
            "password": "Test@123",
            "full_name": "Inactive User",
            "phone": "9876543210",
        },
    )

    user = (
        db_session.query(User)
        .filter(
            User.email == "inactive@test.com"
        )
        .first()
    )

    assert user is not None

    user.is_verified = True
    user.is_active = False

    db_session.commit()

    response = client.post(
        "/auth/login",
        data={
            "username": "inactive@test.com",
            "password": "Test@123",
        },
    )

    assert response.status_code == 403

    assert (
        response.json()["detail"]
        == "Account is inactive"
    )


# ==========================================================
# PROTECTED /ME ENDPOINT
# ==========================================================

def test_auth_me(
    client,
    db_session,
    monkeypatch
):
    """
    Verify that a valid JWT can access /auth/me.
    """

    monkeypatch.setattr(
        "app.routers.auth.send_email",
        lambda **kwargs: None
    )

    client.post(
        "/auth/signup",
        json={
            "email": "me@test.com",
            "password": "Test@123",
            "full_name": "Me Test User",
            "phone": "9876543210",
        },
    )

    user = (
        db_session.query(User)
        .filter(
            User.email == "me@test.com"
        )
        .first()
    )

    assert user is not None

    user.is_verified = True

    db_session.commit()

    login_response = client.post(
        "/auth/login",
        data={
            "username": "me@test.com",
            "password": "Test@123",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["email"] == "me@test.com"
    assert data["role"] == "user"


# ==========================================================
# PROTECTED /ME WITHOUT TOKEN
# ==========================================================

def test_auth_me_without_token(client):
    """
    /auth/me must reject unauthenticated requests.
    """

    response = client.get("/auth/me")

    assert response.status_code in [401, 403]