from datetime import datetime, date

from app.models.income import Income
from app.models.expense import Expense
from app.models.bank_account import BankAccount
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
    bank_name="Analytics Bank",
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


def create_income(
    db_session,
    user_id,
    amount,
    source="Salary",
    transaction_date=None,
    bank_account_id=None,
):
    income = Income(
        user_id=user_id,
        source=source,
        amount=amount,
        notes="Analytics test income",
        date=transaction_date or datetime.utcnow(),
        bank_account_id=bank_account_id,
    )

    db_session.add(income)
    db_session.commit()
    db_session.refresh(income)

    return income


def create_expense(
    db_session,
    user_id,
    amount,
    category="Food",
    transaction_date=None,
    bank_account_id=None,
):
    expense = Expense(
        user_id=user_id,
        category=category,
        amount=amount,
        description="Analytics test expense",
        date=transaction_date or datetime.utcnow(),
        bank_account_id=bank_account_id,
    )

    db_session.add(expense)
    db_session.commit()
    db_session.refresh(expense)

    return expense


def create_savings_goal(
    db_session,
    user_id,
    title="Emergency Fund",
    target_amount=10000.0,
    current_amount=5000.0,
    target_date=None,
    status="in_progress",
    bank_account_id=None,
):
    goal = SavingsGoal(
        user_id=user_id,
        title=title,
        target_amount=target_amount,
        current_amount=current_amount,
        target_date=target_date,
        status=status,
        bank_account_id=bank_account_id,
    )

    db_session.add(goal)
    db_session.commit()
    db_session.refresh(goal)

    return goal


# ==========================================================
# 1. SPENDING BY CATEGORY
# ==========================================================

def test_spending_by_category(
    client,
    db_session,
    basic_user,
):
    token = login_user(
        client,
        basic_user.email,
    )

    current_month = date.today().month
    current_year = date.today().year

    create_expense(
        db_session,
        basic_user.id,
        amount=500,
        category="Food",
        transaction_date=datetime(
            current_year,
            current_month,
            5,
        ),
    )

    create_expense(
        db_session,
        basic_user.id,
        amount=300,
        category="Food",
        transaction_date=datetime(
            current_year,
            current_month,
            10,
        ),
    )

    create_expense(
        db_session,
        basic_user.id,
        amount=200,
        category="Transportation",
        transaction_date=datetime(
            current_year,
            current_month,
            15,
        ),
    )

    response = client.get(
        "/analytics/spending-by-category",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)

    food = next(
        item
        for item in data
        if item["category"] == "Food"
    )

    transportation = next(
        item
        for item in data
        if item["category"] == "Transportation"
    )

    assert float(food["total"]) == 800
    assert float(transportation["total"]) == 200


# ==========================================================
# 2. ANALYTICS SUMMARY
# ==========================================================

def test_analytics_summary(
    client,
    db_session,
    basic_user,
):
    token = login_user(
        client,
        basic_user.email,
    )

    current_month = date.today().month
    current_year = date.today().year

    bank_account = create_bank_account(
        db_session,
        basic_user.id,
        balance=7000.0,
    )

    create_income(
        db_session,
        basic_user.id,
        amount=10000,
        source="Salary",
        transaction_date=datetime(
            current_year,
            current_month,
            1,
        ),
        bank_account_id=bank_account.id,
    )

    create_expense(
        db_session,
        basic_user.id,
        amount=3000,
        category="Food",
        transaction_date=datetime(
            current_year,
            current_month,
            5,
        ),
        bank_account_id=bank_account.id,
    )

    response = client.get(
        "/analytics/summary",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert float(data["total_income"]) == 10000
    assert float(data["total_expenses"]) == 3000
    assert float(data["net_balance"]) == 7000

    assert float(data["savings_rate"]) == 70


# ==========================================================
# 3. USER DATA ISOLATION
# ==========================================================

def test_analytics_user_data_isolation(
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

    current_month = date.today().month
    current_year = date.today().year

    # User A's expense
    create_expense(
        db_session,
        basic_user.id,
        amount=9999,
        category="Food",
        transaction_date=datetime(
            current_year,
            current_month,
            5,
        ),
    )

    # User B's expense
    create_expense(
        db_session,
        premium_user.id,
        amount=100,
        category="Food",
        transaction_date=datetime(
            current_year,
            current_month,
            5,
        ),
    )

    response_a = client.get(
        "/analytics/spending-by-category",
        headers={
            "Authorization": f"Bearer {token_a}"
        },
    )

    response_b = client.get(
        "/analytics/spending-by-category",
        headers={
            "Authorization": f"Bearer {token_b}"
        },
    )

    assert response_a.status_code == 200
    assert response_b.status_code == 200

    data_a = response_a.json()
    data_b = response_b.json()

    food_a = next(
        item
        for item in data_a
        if item["category"] == "Food"
    )

    food_b = next(
        item
        for item in data_b
        if item["category"] == "Food"
    )

    assert float(food_a["total"]) == 9999
    assert float(food_b["total"]) == 100


# ==========================================================
# 4. BASIC USER GETS CURRENT MONTH ONLY
# ==========================================================

def test_basic_user_analytics_uses_current_month(
    client,
    db_session,
    basic_user,
):
    token = login_user(
        client,
        basic_user.email,
    )

    today = date.today()

    current_month = today.month
    current_year = today.year

    # Current month
    create_expense(
        db_session,
        basic_user.id,
        amount=500,
        category="Food",
        transaction_date=datetime(
            current_year,
            current_month,
            5,
        ),
    )

    # Previous month
    if current_month == 1:
        previous_month = 12
        previous_year = current_year - 1
    else:
        previous_month = current_month - 1
        previous_year = current_year

    create_expense(
        db_session,
        basic_user.id,
        amount=900,
        category="Shopping",
        transaction_date=datetime(
            previous_year,
            previous_month,
            5,
        ),
    )

    response = client.get(
        "/analytics/spending-by-category",
        headers={
            "Authorization": f"Bearer {token}"
        },
        params={
            "month": previous_month,
            "year": previous_year,
        },
    )

    assert response.status_code == 200

    data = response.json()

    # Basic users cannot request historical
    # analytics. The router resolves the request
    # back to the current month.
    categories = {
        item["category"]: float(item["total"])
        for item in data
    }

    assert categories.get("Food", 0) == 500
    assert categories.get("Shopping", 0) == 0


# ==========================================================
# 5. PREMIUM USER CAN REQUEST HISTORICAL ANALYTICS
# ==========================================================

def test_premium_user_can_request_historical_analytics(
    client,
    db_session,
    premium_user,
):
    token = login_user(
        client,
        premium_user.email,
    )

    today = date.today()

    if today.month == 1:
        previous_month = 12
        previous_year = today.year - 1
    else:
        previous_month = today.month - 1
        previous_year = today.year

    create_expense(
        db_session,
        premium_user.id,
        amount=1200,
        category="Travel",
        transaction_date=datetime(
            previous_year,
            previous_month,
            10,
        ),
    )

    response = client.get(
        "/analytics/spending-by-category",
        headers={
            "Authorization": f"Bearer {token}"
        },
        params={
            "month": previous_month,
            "year": previous_year,
        },
    )

    assert response.status_code == 200

    data = response.json()

    travel = next(
        item
        for item in data
        if item["category"] == "Travel"
    )

    assert float(travel["total"]) == 1200


# ==========================================================
# 6. BASIC USER CANNOT ACCESS SAVINGS PROGRESS
# ==========================================================

def test_basic_user_cannot_access_savings_progress(
    client,
    basic_user,
):
    token = login_user(
        client,
        basic_user.email,
    )

    response = client.get(
        "/analytics/savings-progress",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 403

    assert (
        "Premium and Admin users"
        in response.json()["detail"]
    )


# ==========================================================
# 7. PREMIUM USER CAN ACCESS SAVINGS PROGRESS
# ==========================================================

def test_premium_user_can_access_savings_progress(
    client,
    db_session,
    premium_user,
):
    token = login_user(
        client,
        premium_user.email,
    )

    today = date.today()

    create_savings_goal(
        db_session,
        premium_user.id,
        title="Emergency Fund",
        target_amount=10000,
        current_amount=5000,
        target_date=date(
            today.year,
            today.month,
            28,
        ),
        status="in_progress",
    )

    response = client.get(
        "/analytics/savings-progress",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 1

    goal = data[0]

    assert goal["title"] == "Emergency Fund"
    assert float(goal["target_amount"]) == 10000
    assert float(goal["current_amount"]) == 5000
    assert float(goal["percentage"]) == 50
    assert goal["status"] == "in_progress"


# ==========================================================
# 8. BASIC USER MONTHLY TREND IS DAILY CURRENT MONTH
# ==========================================================

def test_basic_user_monthly_trend(
    client,
    db_session,
    basic_user,
):
    token = login_user(
        client,
        basic_user.email,
    )

    today = date.today()

    create_income(
        db_session,
        basic_user.id,
        amount=5000,
        source="Salary",
        transaction_date=datetime(
            today.year,
            today.month,
            5,
        ),
    )

    create_expense(
        db_session,
        basic_user.id,
        amount=1500,
        category="Food",
        transaction_date=datetime(
            today.year,
            today.month,
            6,
        ),
    )

    response = client.get(
        "/analytics/monthly-trend",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)

    # Basic users receive daily current-month
    # trend data from the router.
    assert len(data) >= 1

    assert all(
        "month" in item
        for item in data
    )

    assert all(
        "total_income" in item
        for item in data
    )

    assert all(
        "total_expenses" in item
        for item in data
    )


# ==========================================================
# 9. PREMIUM MONTHLY TREND VALIDATES GRANULARITY
# ==========================================================

def test_premium_monthly_trend_invalid_granularity(
    client,
    premium_user,
):
    token = login_user(
        client,
        premium_user.email,
    )

    response = client.get(
        "/analytics/monthly-trend",
        headers={
            "Authorization": f"Bearer {token}"
        },
        params={
            "months": 3,
            "granularity": "year",
        },
    )

    assert response.status_code == 400

    assert (
        response.json()["detail"]
        == "granularity must be 'day' or 'month'."
    )


# ==========================================================
# 10. PREMIUM CUSTOM DATE RANGE VALIDATION
# ==========================================================

def test_premium_custom_date_range_validation(
    client,
    premium_user,
):
    token = login_user(
        client,
        premium_user.email,
    )

    response = client.get(
        "/analytics/monthly-trend",
        headers={
            "Authorization": f"Bearer {token}"
        },
        params={
            "start_date": "2026-09-10",
            "end_date": "2026-09-01",
        },
    )

    assert response.status_code == 400

    assert (
        response.json()["detail"]
        == "start_date must be before or equal to end_date."
    )


# ==========================================================
# 11. BASIC USER CANNOT ACCESS ACCOUNT BALANCE
# ==========================================================

def test_basic_user_cannot_access_account_balance(
    client,
    basic_user,
):
    token = login_user(
        client,
        basic_user.email,
    )

    response = client.get(
        "/analytics/account-balance",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 403

    assert (
        "Premium and Admin users"
        in response.json()["detail"]
    )


# ==========================================================
# 12. ADMIN HAS ADVANCED ANALYTICS ACCESS
# ==========================================================

def test_admin_has_advanced_analytics_access(
    client,
    admin_user,
):
    token = login_user(
        client,
        admin_user.email,
    )

    response = client.get(
        "/analytics/savings-progress",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    assert isinstance(
        response.json(),
        list,
    )


# ==========================================================
# 13. UNAUTHENTICATED ANALYTICS ACCESS
# ==========================================================

def test_analytics_requires_authentication(
    client,
):
    response = client.get(
        "/analytics/summary",
    )

    assert response.status_code == 401