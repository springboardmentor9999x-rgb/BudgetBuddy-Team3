from datetime import datetime

from app.models.expense import Expense
from app.models.budget import Budget
from app.models.bank_account import BankAccount
from app.models.notification import Notification


# ==========================================================
# HELPER: LOGIN
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


# ==========================================================
# HELPER: CREATE VERIFIED USER
# ==========================================================

def create_verified_user(
    client,
    db_session,
    monkeypatch,
    email,
    full_name,
    phone,
):
    from app.models.user import User

    monkeypatch.setattr(
        "app.routers.auth.send_email",
        lambda **kwargs: None
    )

    response = client.post(
        "/auth/signup",
        json={
            "email": email,
            "password": "Test@123",
            "full_name": full_name,
            "phone": phone,
        },
    )

    assert response.status_code == 200

    user = (
        db_session.query(User)
        .filter(User.email == email)
        .first()
    )

    assert user is not None

    user.is_verified = True

    db_session.commit()
    db_session.refresh(user)

    return user


# ==========================================================
# HELPER: CREATE BANK ACCOUNT
# ==========================================================

def create_bank_account(
    db_session,
    user_id,
    bank_name="Test Bank",
    account_type="Savings Account",
    balance=10000.0,
):
    account = BankAccount(
        user_id=user_id,
        bank_name=bank_name,
        account_number="1234567890",
        account_type=account_type,
        balance=balance,
    )

    db_session.add(account)
    db_session.commit()
    db_session.refresh(account)

    return account


# ==========================================================
# 1. CREATE EXPENSE
# ==========================================================

def test_create_expense(
    client,
    db_session,
    basic_user,
):
    """
    A user can create an expense using their own bank account.
    """

    token = login_user(
        client,
        basic_user.email,
    )

    account = create_bank_account(
        db_session,
        basic_user.id,
    )

    response = client.post(
        "/expenses/",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "category": "Food",
            "amount": 500,
            "description": "Lunch",
            "bank_account_id": account.id,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["category"] == "Food"
    assert data["amount"] == 500
    assert data["description"] == "Lunch"
    assert data["user_id"] == basic_user.id
    assert data["bank_account_id"] == account.id

    # Verify database record.
    expense = (
        db_session.query(Expense)
        .filter(
            Expense.id == data["id"]
        )
        .first()
    )

    assert expense is not None
    assert expense.user_id == basic_user.id


# ==========================================================
# 2. GET EXPENSES
# ==========================================================

def test_get_expenses(
    client,
    db_session,
    basic_user,
):
    """
    User can retrieve their own expenses.
    """

    token = login_user(
        client,
        basic_user.email,
    )

    account = create_bank_account(
        db_session,
        basic_user.id,
    )

    expense_1 = Expense(
        user_id=basic_user.id,
        bank_account_id=account.id,
        category="Food",
        amount=300,
        description="Breakfast",
    )

    expense_2 = Expense(
        user_id=basic_user.id,
        bank_account_id=account.id,
        category="Travel",
        amount=700,
        description="Bus",
    )

    db_session.add_all(
        [expense_1, expense_2]
    )

    db_session.commit()

    response = client.get(
        "/expenses/",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2

    categories = {
        expense["category"]
        for expense in data
    }

    assert "Food" in categories
    assert "Travel" in categories


# ==========================================================
# 3. GET SINGLE EXPENSE
# ==========================================================

def test_get_single_expense(
    client,
    db_session,
    basic_user,
):
    """
    User can retrieve one of their own expenses.
    """

    token = login_user(
        client,
        basic_user.email,
    )

    expense = Expense(
        user_id=basic_user.id,
        category="Shopping",
        amount=1000,
        description="Clothes",
    )

    db_session.add(expense)
    db_session.commit()
    db_session.refresh(expense)

    response = client.get(
        f"/expenses/{expense.id}",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == expense.id
    assert data["user_id"] == basic_user.id
    assert data["category"] == "Shopping"


# ==========================================================
# 4. UPDATE EXPENSE
# ==========================================================

def test_update_expense(
    client,
    db_session,
    basic_user,
):
    """
    User can update their own expense.
    """

    token = login_user(
        client,
        basic_user.email,
    )

    account = create_bank_account(
        db_session,
        basic_user.id,
    )

    expense = Expense(
        user_id=basic_user.id,
        bank_account_id=account.id,
        category="Food",
        amount=400,
        description="Old description",
    )

    db_session.add(expense)
    db_session.commit()
    db_session.refresh(expense)

    response = client.put(
        f"/expenses/{expense.id}",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "category": "Groceries",
            "amount": 600,
            "description": "Updated groceries",
            "bank_account_id": account.id,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == expense.id
    assert data["category"] == "Groceries"
    assert data["amount"] == 600
    assert data["description"] == "Updated groceries"


# ==========================================================
# 5. DELETE EXPENSE
# ==========================================================

def test_delete_expense(
    client,
    db_session,
    basic_user,
):
    """
    User can delete their own expense.
    """

    token = login_user(
        client,
        basic_user.email,
    )

    expense = Expense(
        user_id=basic_user.id,
        category="Entertainment",
        amount=250,
        description="Movie",
    )

    db_session.add(expense)
    db_session.commit()
    db_session.refresh(expense)

    expense_id = expense.id

    response = client.delete(
        f"/expenses/{expense_id}",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    assert (
        response.json()["message"]
        == "Expense deleted successfully"
    )

    deleted_expense = (
        db_session.query(Expense)
        .filter(
            Expense.id == expense_id
        )
        .first()
    )

    assert deleted_expense is None


# ==========================================================
# 6. NEGATIVE AMOUNT VALIDATION
# ==========================================================

def test_negative_expense_amount_rejected(
    client,
    basic_user,
):
    """
    Expense amount must be greater than zero.
    """

    token = login_user(
        client,
        basic_user.email,
    )

    response = client.post(
        "/expenses/",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "category": "Food",
            "amount": -500,
            "description": "Invalid expense",
        },
    )

    assert response.status_code == 422


# ==========================================================
# 7. OWNERSHIP ISOLATION
# ==========================================================

def test_expense_ownership_isolation(
    client,
    db_session,
    monkeypatch,
):
    """
    User A must NOT be able to access, update,
    or delete User B's expense.
    """

    # ------------------------------------------------------
    # CREATE USER A
    # ------------------------------------------------------

    user_a = create_verified_user(
        client,
        db_session,
        monkeypatch,
        "usera@test.com",
        "User A",
        "9000000001",
    )

    # ------------------------------------------------------
    # CREATE USER B
    # ------------------------------------------------------

    user_b = create_verified_user(
        client,
        db_session,
        monkeypatch,
        "userb@test.com",
        "User B",
        "9000000002",
    )

    token_a = login_user(
        client,
        user_a.email,
    )

    # ------------------------------------------------------
    # CREATE USER B'S EXPENSE
    # ------------------------------------------------------

    expense_b = Expense(
        user_id=user_b.id,
        category="Shopping",
        amount=2000,
        description="User B private expense",
    )

    db_session.add(expense_b)
    db_session.commit()
    db_session.refresh(expense_b)

    expense_id = expense_b.id

    # ------------------------------------------------------
    # USER A TRIES TO GET USER B'S EXPENSE
    # ------------------------------------------------------

    response = client.get(
        f"/expenses/{expense_id}",
        headers={
            "Authorization": f"Bearer {token_a}"
        },
    )

    assert response.status_code == 404

    # ------------------------------------------------------
    # USER A TRIES TO UPDATE USER B'S EXPENSE
    # ------------------------------------------------------

    response = client.put(
        f"/expenses/{expense_id}",
        headers={
            "Authorization": f"Bearer {token_a}"
        },
        json={
            "category": "Food",
            "amount": 100,
            "description": "Unauthorized update",
            "bank_account_id": None,
        },
    )

    assert response.status_code == 404

    # ------------------------------------------------------
    # USER A TRIES TO DELETE USER B'S EXPENSE
    # ------------------------------------------------------

    response = client.delete(
        f"/expenses/{expense_id}",
        headers={
            "Authorization": f"Bearer {token_a}"
        },
    )

    assert response.status_code == 404

    # ------------------------------------------------------
    # VERIFY USER B'S EXPENSE STILL EXISTS
    # ------------------------------------------------------

    remaining_expense = (
        db_session.query(Expense)
        .filter(
            Expense.id == expense_id
        )
        .first()
    )

    assert remaining_expense is not None
    assert remaining_expense.user_id == user_b.id
    assert remaining_expense.amount == 2000


# ==========================================================
# 8. BANK ACCOUNT OWNERSHIP
# ==========================================================

def test_expense_cannot_use_another_users_bank_account(
    client,
    db_session,
    monkeypatch,
):
    """
    A user cannot create an expense using another
    user's bank account.
    """

    user_a = create_verified_user(
        client,
        db_session,
        monkeypatch,
        "expensea@test.com",
        "Expense A",
        "9000000003",
    )

    user_b = create_verified_user(
        client,
        db_session,
        monkeypatch,
        "expenseb@test.com",
        "Expense B",
        "9000000004",
    )

    token_a = login_user(
        client,
        user_a.email,
    )

    account_b = create_bank_account(
        db_session,
        user_b.id,
        bank_name="User B Bank",
        account_type="Savings Account",
        balance=10000,
    )

    response = client.post(
        "/expenses/",
        headers={
            "Authorization": f"Bearer {token_a}"
        },
        json={
            "category": "Food",
            "amount": 500,
            "description": "Unauthorized bank account",
            "bank_account_id": account_b.id,
        },
    )

    assert response.status_code == 400

    assert (
        response.json()["detail"]
        == (
            "Invalid bank account or bank account "
            "does not belong to the user"
        )
    )


# ==========================================================
# 9. BUDGET ALERT TRIGGER
# ==========================================================

def test_budget_alert_trigger(
    client,
    db_session,
    basic_user,
):
    """
    When expenses exceed the matching category/month
    budget, a budget_alert notification is created.
    """

    token = login_user(
        client,
        basic_user.email,
    )

    current_month = datetime.utcnow().strftime(
        "%Y-%m"
    )

    budget = Budget(
        user_id=basic_user.id,
        category="Food",
        monthly_limit=1000,
        month_year=current_month,
    )

    db_session.add(budget)
    db_session.commit()
    db_session.refresh(budget)

    # Create an expense greater than the budget.
    response = client.post(
        "/expenses/",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "category": "Food",
            "amount": 1500,
            "description": "Budget exceeding food expense",
        },
    )

    assert response.status_code == 200

    # Check notification.
    notification = (
        db_session.query(Notification)
        .filter(
            Notification.user_id == basic_user.id,
            Notification.type == "budget_alert",
        )
        .first()
    )

    assert notification is not None
    assert notification.is_read is False

    assert (
        "exceeded your Food budget"
        in notification.message
    )

    assert "1500.00" in notification.message
    assert "1000.00" in notification.message


# ==========================================================
# 10. NO BUDGET ALERT WHEN UNDER LIMIT
# ==========================================================

def test_no_budget_alert_when_under_limit(
    client,
    db_session,
    basic_user,
):
    """
    An expense that does not exceed the budget
    should not create a budget alert.
    """

    token = login_user(
        client,
        basic_user.email,
    )

    current_month = datetime.utcnow().strftime(
        "%Y-%m"
    )

    budget = Budget(
        user_id=basic_user.id,
        category="Groceries",
        monthly_limit=5000,
        month_year=current_month,
    )

    db_session.add(budget)
    db_session.commit()

    response = client.post(
        "/expenses/",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "category": "Groceries",
            "amount": 1000,
            "description": "Within budget",
        },
    )

    assert response.status_code == 200

    notification = (
        db_session.query(Notification)
        .filter(
            Notification.user_id == basic_user.id,
            Notification.type == "budget_alert",
        )
        .first()
    )

    assert notification is None


# ==========================================================
# 11. UNAUTHENTICATED ACCESS
# ==========================================================

def test_expenses_require_authentication(client):
    """
    Expense endpoints must require authentication.
    """

    response = client.get(
        "/expenses/"
    )

    assert response.status_code in [401, 403]