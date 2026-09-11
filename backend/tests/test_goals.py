from datetime import date
from decimal import Decimal

from app.models.bank_account import BankAccount
from app.models.notification import Notification
from app.models.savings_goal import SavingsGoal


# ==========================================================
# HELPERS
# ==========================================================

def login_user(client, email, password="Test@123"):
    response = client.post(
        "/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )

    assert response.status_code == 200

    return response.json()["access_token"]


def create_bank_account(
    db_session,
    user_id,
    bank_name="Test Bank",
    account_number="1234567890",
    account_type="Savings Account",
    balance=10000.0,
):
    bank_account = BankAccount(
        user_id=user_id,
        bank_name=bank_name,
        account_number=account_number,
        account_type=account_type,
        balance=balance,
    )

    db_session.add(bank_account)
    db_session.commit()
    db_session.refresh(bank_account)

    return bank_account


def create_goal(
    client,
    token,
    bank_account_id,
    title="Emergency Fund",
    target_amount=5000,
    current_amount=0,
    target_date=None,
):
    return client.post(
        "/goals/",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "title": title,
            "target_amount": target_amount,
            "current_amount": current_amount,
            "target_date": target_date,
            "status": "in_progress",
            "bank_account_id": bank_account_id,
        },
    )


# ==========================================================
# 1. CREATE SAVINGS GOAL
# ==========================================================

def test_create_savings_goal(
    client,
    db_session,
    basic_user,
):
    token = login_user(
        client,
        basic_user.email,
    )

    bank_account = create_bank_account(
        db_session,
        basic_user.id,
    )

    response = create_goal(
        client,
        token,
        bank_account.id,
        title="Emergency Fund",
        target_amount=5000,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["title"] == "Emergency Fund"
    assert float(data["target_amount"]) == 5000
    assert float(data["current_amount"]) == 0
    assert data["status"] == "in_progress"
    assert data["user_id"] == basic_user.id
    assert data["bank_account_id"] == bank_account.id


# ==========================================================
# 2. GET SAVINGS GOALS
# ==========================================================

def test_get_savings_goals(
    client,
    db_session,
    basic_user,
):
    token = login_user(
        client,
        basic_user.email,
    )

    bank_account = create_bank_account(
        db_session,
        basic_user.id,
    )

    create_goal(
        client,
        token,
        bank_account.id,
        title="Vacation Fund",
        target_amount=10000,
    )

    response = client.get(
        "/goals/",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["title"] == "Vacation Fund"
    assert data[0]["user_id"] == basic_user.id


# ==========================================================
# 3. GET SINGLE SAVINGS GOAL
# ==========================================================

def test_get_single_savings_goal(
    client,
    db_session,
    basic_user,
):
    token = login_user(
        client,
        basic_user.email,
    )

    bank_account = create_bank_account(
        db_session,
        basic_user.id,
    )

    create_response = create_goal(
        client,
        token,
        bank_account.id,
        title="Laptop Fund",
        target_amount=60000,
    )

    assert create_response.status_code == 201

    goal_id = create_response.json()["id"]

    response = client.get(
        f"/goals/{goal_id}",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == goal_id
    assert data["title"] == "Laptop Fund"
    assert data["user_id"] == basic_user.id


# ==========================================================
# 4. UPDATE SAVINGS GOAL
# ==========================================================

def test_update_savings_goal(
    client,
    db_session,
    basic_user,
):
    token = login_user(
        client,
        basic_user.email,
    )

    bank_account = create_bank_account(
        db_session,
        basic_user.id,
    )

    create_response = create_goal(
        client,
        token,
        bank_account.id,
        title="Phone Fund",
        target_amount=30000,
    )

    assert create_response.status_code == 201

    goal_id = create_response.json()["id"]

    response = client.put(
        f"/goals/{goal_id}",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "title": "New Phone Fund",
            "target_amount": 40000,
            "current_amount": 0,
            "target_date": str(date.today()),
            "status": "in_progress",
            "bank_account_id": bank_account.id,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == goal_id
    assert data["title"] == "New Phone Fund"
    assert float(data["target_amount"]) == 40000
    assert data["status"] == "in_progress"


# ==========================================================
# 5. DELETE SAVINGS GOAL
# ==========================================================

def test_delete_savings_goal(
    client,
    db_session,
    basic_user,
):
    token = login_user(
        client,
        basic_user.email,
    )

    bank_account = create_bank_account(
        db_session,
        basic_user.id,
    )

    create_response = create_goal(
        client,
        token,
        bank_account.id,
        title="Delete Me",
        target_amount=5000,
    )

    assert create_response.status_code == 201

    goal_id = create_response.json()["id"]

    response = client.delete(
        f"/goals/{goal_id}",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == goal_id
    assert data["title"] == "Delete Me"

    get_response = client.get(
        f"/goals/{goal_id}",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert get_response.status_code == 404


# ==========================================================
# 6. OWNERSHIP ISOLATION
# ==========================================================

def test_savings_goal_ownership_isolation(
    client,
    db_session,
    basic_user,
    premium_user,
):
    token_a = login_user(
        client,
        basic_user.email,
    )

    token_b = login_user(
        client,
        premium_user.email,
    )

    bank_account_a = create_bank_account(
        db_session,
        basic_user.id,
        bank_name="User A Bank",
        account_number="1111111111",
    )

    create_response = create_goal(
        client,
        token_a,
        bank_account_a.id,
        title="User A Goal",
        target_amount=10000,
    )

    assert create_response.status_code == 201

    goal_id = create_response.json()["id"]

    # User B tries to GET User A's goal.
    get_response = client.get(
        f"/goals/{goal_id}",
        headers={
            "Authorization": f"Bearer {token_b}"
        },
    )

    assert get_response.status_code == 404

    # User B tries to UPDATE User A's goal.
    # User B's own bank account is required by the schema.
    bank_account_b = create_bank_account(
        db_session,
        premium_user.id,
        bank_name="User B Bank",
        account_number="2222222222",
    )

    update_response = client.put(
        f"/goals/{goal_id}",
        headers={
            "Authorization": f"Bearer {token_b}"
        },
        json={
            "title": "Hacked Goal",
            "target_amount": 99999,
            "current_amount": 0,
            "target_date": None,
            "status": "in_progress",
            "bank_account_id": bank_account_b.id,
        },
    )

    assert update_response.status_code == 404

    # User B tries to DELETE User A's goal.
    delete_response = client.delete(
        f"/goals/{goal_id}",
        headers={
            "Authorization": f"Bearer {token_b}"
        },
    )

    assert delete_response.status_code == 404

    # Confirm User A's goal still exists.
    owner_response = client.get(
        f"/goals/{goal_id}",
        headers={
            "Authorization": f"Bearer {token_a}"
        },
    )

    assert owner_response.status_code == 200
    assert owner_response.json()["title"] == "User A Goal"


# ==========================================================
# 7. CONTRIBUTION UPDATES GOAL AND BANK BALANCE
# ==========================================================

def test_contribute_to_savings_goal(
    client,
    db_session,
    basic_user,
):
    token = login_user(
        client,
        basic_user.email,
    )

    bank_account = create_bank_account(
        db_session,
        basic_user.id,
        balance=10000.0,
    )

    create_response = create_goal(
        client,
        token,
        bank_account.id,
        title="Car Fund",
        target_amount=5000,
    )

    assert create_response.status_code == 201

    goal_id = create_response.json()["id"]

    response = client.patch(
        f"/goals/{goal_id}/contribute",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "amount": 1000,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == goal_id
    assert float(data["current_amount"]) == 1000
    assert data["status"] == "in_progress"

    db_session.refresh(bank_account)

    assert bank_account.balance == 9000.0


# ==========================================================
# 8. GOAL COMPLETION TRIGGER
# ==========================================================

def test_goal_completion_trigger(
    client,
    db_session,
    basic_user,
):
    token = login_user(
        client,
        basic_user.email,
    )

    bank_account = create_bank_account(
        db_session,
        basic_user.id,
        balance=10000.0,
    )

    create_response = create_goal(
        client,
        token,
        bank_account.id,
        title="Complete Goal",
        target_amount=5000,
    )

    assert create_response.status_code == 201

    goal_id = create_response.json()["id"]

    response = client.patch(
        f"/goals/{goal_id}/contribute",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "amount": 5000,
        },
    )

    assert response.status_code == 200

    data = response.json()

    # Goal must become completed.
    assert float(data["current_amount"]) == 5000
    assert data["status"] == "completed"

    # Bank balance must be reduced.
    db_session.refresh(bank_account)

    assert bank_account.balance == 5000.0

    # Completion notification must be created.
    notification = (
        db_session.query(Notification)
        .filter(
            Notification.user_id == basic_user.id,
            Notification.type == "goal_completed",
        )
        .first()
    )

    assert notification is not None

    assert (
        notification.message
        == "Congratulations! You've completed "
        "your Complete Goal savings goal!"
    )

    assert notification.is_read is False


# ==========================================================
# 9. PREVENT OVER-CONTRIBUTION
# ==========================================================

def test_cannot_contribute_more_than_remaining_amount(
    client,
    db_session,
    basic_user,
):
    token = login_user(
        client,
        basic_user.email,
    )

    bank_account = create_bank_account(
        db_session,
        basic_user.id,
        balance=10000.0,
    )

    create_response = create_goal(
        client,
        token,
        bank_account.id,
        title="Limited Goal",
        target_amount=5000,
    )

    assert create_response.status_code == 201

    goal_id = create_response.json()["id"]

    response = client.patch(
        f"/goals/{goal_id}/contribute",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "amount": 6000,
        },
    )

    assert response.status_code == 400

    assert (
        "Contribution cannot exceed"
        in response.json()["detail"]
    )

    # Make sure neither the goal nor bank balance changed.
    db_session.expire_all()

    goal = (
        db_session.query(SavingsGoal)
        .filter(
            SavingsGoal.id == goal_id
        )
        .first()
    )

    bank_account = (
        db_session.query(BankAccount)
        .filter(
            BankAccount.id == bank_account.id
        )
        .first()
    )

    assert float(goal.current_amount) == 0
    assert goal.status == "in_progress"
    assert bank_account.balance == 10000.0


# ==========================================================
# 10. AUTHENTICATION REQUIRED
# ==========================================================

def test_savings_goals_require_authentication(
    client,
):
    response = client.get("/goals/")

    assert response.status_code == 401