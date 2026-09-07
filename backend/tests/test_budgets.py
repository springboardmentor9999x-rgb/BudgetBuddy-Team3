from datetime import datetime

from app.models import Budget


def get_current_month_year():
    return datetime.utcnow().strftime("%Y-%m")


def login_user(client, email):
    response = client.post(
        "/auth/login",
        data={
            "username": email,
            "password": "Test@123",
        },
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    return {
        "Authorization": f"Bearer {token}"
    }


# ============================================================
# CREATE BUDGET
# ============================================================

def test_create_budget(client, basic_user):
    headers = login_user(client, basic_user.email)

    response = client.post(
        "/budgets/",
        headers=headers,
        json={
            "category": "Food",
            "monthly_limit": 5000,
            "month_year": get_current_month_year(),
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["category"] == "Food"
    assert float(data["monthly_limit"]) == 5000
    assert data["user_id"] == basic_user.id


# ============================================================
# GET BUDGETS
# ============================================================

def test_get_budgets(client, basic_user, db_session):
    budget = Budget(
        user_id=basic_user.id,
        category="Food",
        monthly_limit=5000,
        month_year=get_current_month_year(),
    )

    db_session.add(budget)
    db_session.commit()

    headers = login_user(client, basic_user.email)

    response = client.get(
        "/budgets/",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1

    food_budget = next(
        item for item in data
        if item["category"] == "Food"
    )

    assert float(food_budget["monthly_limit"]) == 5000
    assert food_budget["user_id"] == basic_user.id


# ============================================================
# GET SINGLE BUDGET
# ============================================================

def test_get_single_budget(client, basic_user, db_session):
    budget = Budget(
        user_id=basic_user.id,
        category="Transportation",
        monthly_limit=3000,
        month_year=get_current_month_year(),
    )

    db_session.add(budget)
    db_session.commit()
    db_session.refresh(budget)

    headers = login_user(client, basic_user.email)

    response = client.get(
        f"/budgets/{budget.id}",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == budget.id
    assert data["category"] == "Transportation"
    assert float(data["monthly_limit"]) == 3000
    assert data["user_id"] == basic_user.id


# ============================================================
# UPDATE BUDGET
# ============================================================

def test_update_budget(client, basic_user, db_session):
    budget = Budget(
        user_id=basic_user.id,
        category="Food",
        monthly_limit=5000,
        month_year=get_current_month_year(),
    )

    db_session.add(budget)
    db_session.commit()
    db_session.refresh(budget)

    headers = login_user(client, basic_user.email)

    response = client.put(
        f"/budgets/{budget.id}",
        headers=headers,
        json={
            "category": "Food",
            "monthly_limit": 7500,
            "month_year": budget.month_year,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == budget.id
    assert data["category"] == "Food"
    assert float(data["monthly_limit"]) == 7500
    assert data["user_id"] == basic_user.id


# ============================================================
# DELETE BUDGET
# ============================================================

def test_delete_budget(client, basic_user, db_session):
    budget = Budget(
        user_id=basic_user.id,
        category="Entertainment",
        monthly_limit=2000,
        month_year=get_current_month_year(),
    )

    db_session.add(budget)
    db_session.commit()
    db_session.refresh(budget)

    budget_id = budget.id

    headers = login_user(client, basic_user.email)

    response = client.delete(
        f"/budgets/{budget_id}",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "Budget deleted successfully"

    deleted_budget = (
        db_session.query(Budget)
        .filter(Budget.id == budget_id)
        .first()
    )

    assert deleted_budget is None


# ============================================================
# OWNERSHIP ISOLATION
# User A must NOT access User B's budget
# ============================================================

def test_budget_ownership_isolation(
    client,
    basic_user,
    db_session,
):
    from app.core.security import hash_password
    from app.models import User

    user_b = User(
        email="budget-user-b@test.com",
        hashed_password=hash_password("Test@123"),
        full_name="Budget User B",
        phone="9876543220",
        role="user",
        is_active=True,
        is_verified=True,
        trial_used=False,
    )

    db_session.add(user_b)
    db_session.commit()
    db_session.refresh(user_b)

    budget_b = Budget(
        user_id=user_b.id,
        category="Shopping",
        monthly_limit=4000,
        month_year=get_current_month_year(),
    )

    db_session.add(budget_b)
    db_session.commit()
    db_session.refresh(budget_b)

    # Login as User A
    headers_a = login_user(
        client,
        basic_user.email,
    )

    # User A tries to access User B's budget
    response = client.get(
        f"/budgets/{budget_b.id}",
        headers=headers_a,
    )

    assert response.status_code == 404

    # User A tries to update User B's budget
    response = client.put(
        f"/budgets/{budget_b.id}",
        headers=headers_a,
        json={
            "category": "Shopping",
            "monthly_limit": 9000,
            "month_year": budget_b.month_year,
        },
    )

    assert response.status_code == 404

    # User A tries to delete User B's budget
    response = client.delete(
        f"/budgets/{budget_b.id}",
        headers=headers_a,
    )

    assert response.status_code == 404

    # Verify User B's budget still exists
    db_session.expire_all()

    existing_budget = (
        db_session.query(Budget)
        .filter(Budget.id == budget_b.id)
        .first()
    )

    assert existing_budget is not None
    assert existing_budget.user_id == user_b.id
    assert float(existing_budget.monthly_limit) == 4000


# ============================================================
# NEGATIVE BUDGET AMOUNT
# ============================================================

def test_negative_budget_amount_rejected(
    client,
    basic_user,
):
    headers = login_user(client, basic_user.email)

    response = client.post(
        "/budgets/",
        headers=headers,
        json={
            "category": "Food",
            "monthly_limit": -1000,
            "month_year": get_current_month_year(),
        },
    )

    assert response.status_code == 422


# ============================================================
# ZERO BUDGET AMOUNT
# ============================================================

def test_zero_budget_amount_rejected(
    client,
    basic_user,
):
    headers = login_user(client, basic_user.email)

    response = client.post(
        "/budgets/",
        headers=headers,
        json={
            "category": "Food",
            "monthly_limit": 0,
            "month_year": get_current_month_year(),
        },
    )

    assert response.status_code == 422


# ============================================================
# AUTHENTICATION REQUIRED
# ============================================================

def test_budgets_require_authentication(client):
    response = client.get("/budgets/")

    assert response.status_code == 401