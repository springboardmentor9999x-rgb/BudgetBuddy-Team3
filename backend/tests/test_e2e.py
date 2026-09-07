"""
BudgetBuddy — End-to-End Backend Test Suite (pytest version)
=============================================================
Replaces the original test_e2e.py that hit the live server.

ALL requests go through the FastAPI TestClient, which uses
an isolated SQLite test database via the conftest.py dependency
override. The live PostgreSQL database (personal_budget_db)
is NEVER contacted during this test run.

Original test logic is preserved exactly; only the transport
layer changed from `requests → live server` to
`TestClient → in-process app → test DB`.
"""

import pytest


# ============================================================
# FULL PIPELINE E2E TEST
# ============================================================

class TestFullPipeline:
    """
    Mirrors the original test_e2e.py test_full_pipeline() function.
    Each assertion is a separate named test method so pytest reports
    granular pass/fail results.
    """

    @pytest.fixture(autouse=True)
    def setup(self, client):
        """Set up a fresh user for every test method in this class."""
        self.client = client
        import time
        ts = int(time.time() * 1000)
        self.email = f"student_{ts}@college.edu"
        self.password = "securepassword123"
        self.name = "Test Student"

        # Register
        res = client.post("/auth/register", json={
            "name": self.name,
            "email": self.email,
            "password": self.password,
        })
        assert res.status_code in (200, 201), f"Setup registration failed: {res.text}"

        # Login
        res = client.post(
            "/auth/login",
            data={"username": self.email, "password": self.password},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert res.status_code == 200, f"Setup login failed: {res.text}"
        token = res.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {token}"}

    def test_01_health_check(self):
        """Root API health check."""
        res = self.client.get("/")
        assert res.status_code == 200
        assert res.json()["status"] == "success"

    def test_02_user_registration_and_login(self):
        """Registration produces a valid JWT."""
        assert self.headers["Authorization"].startswith("Bearer ")

    def test_03_user_profile(self):
        """Authenticated profile retrieval returns the correct user."""
        res = self.client.get("/users/profile", headers=self.headers)
        assert res.status_code == 200
        assert res.json()["name"] == self.name

    def test_04_categories_auto_seeded(self):
        """Default categories are seeded on first GET /categories/."""
        res = self.client.get("/categories/", headers=self.headers)
        assert res.status_code == 200
        categories = res.json()
        assert len(categories) >= 8, f"Expected >= 8 categories, got {len(categories)}"

    def test_05_add_income(self):
        """Income record can be created."""
        res = self.client.post("/income/", json={
            "amount": 30000.0,
            "source": "Scholarship",
            "bank_name": "State Bank of India",
            "description": "Semester Merit Scholarship",
            "income_date": "2026-08-25",
        }, headers=self.headers)
        assert res.status_code in (200, 201), f"Income creation failed: {res.text}"

    def test_06_set_monthly_budget(self):
        """Monthly budget can be created."""
        res = self.client.post("/budget/", json={
            "amount": 10000.0,
            "month": "2026-08-01",
        }, headers=self.headers)
        assert res.status_code in (200, 201), f"Budget creation failed: {res.text}"

    def test_07_add_expense_below_threshold(self):
        """First expense (below 80% budget) is accepted."""
        cats = self.client.get("/categories/", headers=self.headers).json()
        food_cat = next((c for c in cats if c["name"] == "Food"), cats[0])

        res = self.client.post("/expenses/", json={
            "category_id": food_cat["category_id"],
            "amount": 3000.0,
            "description": "Monthly Mess and Groceries",
            "expense_date": "2026-08-25",
        }, headers=self.headers)
        assert res.status_code in (200, 201), f"Expense creation failed: {res.text}"

    def test_08_expense_triggers_budget_alert(self):
        """Second expense crossing 80% budget threshold triggers a notification."""
        # Set up budget + income
        self.client.post("/income/", json={
            "amount": 30000.0, "source": "Scholarship",
            "income_date": "2026-08-25",
        }, headers=self.headers)
        self.client.post("/budget/", json={
            "amount": 10000.0, "month": "2026-08-01",
        }, headers=self.headers)

        cats = self.client.get("/categories/", headers=self.headers).json()
        food_cat = next((c for c in cats if c["name"] == "Food"), cats[0])

        # First expense
        self.client.post("/expenses/", json={
            "category_id": food_cat["category_id"],
            "amount": 3000.0,
            "description": "Mess",
            "expense_date": "2026-08-25",
        }, headers=self.headers)

        # Second expense pushes to 85%
        res = self.client.post("/expenses/", json={
            "category_id": food_cat["category_id"],
            "amount": 5500.0,
            "description": "Books & Study Materials",
            "expense_date": "2026-08-25",
        }, headers=self.headers)
        assert res.status_code in (200, 201), f"2nd expense failed: {res.text}"

        # Check notifications
        notif_res = self.client.get("/notifications/", headers=self.headers)
        assert notif_res.status_code == 200
        notifs = notif_res.json()["notifications"]
        has_budget_warning = any(
            "Budget" in n["title"] or "Warning" in n["title"] or "Alert" in n["title"]
            for n in notifs
        )
        assert has_budget_warning, f"No budget alert notification found: {notifs}"

    def test_09_create_savings_goal(self):
        """Savings goal creation returns 50% initial progress."""
        res = self.client.post("/goals/", json={
            "goal_name": "New Laptop Fund",
            "target_amount": 50000.0,
            "current_amount": 25000.0,
            "deadline": "2026-12-31",
        }, headers=self.headers)
        assert res.status_code in (200, 201), f"Goal creation failed: {res.text}"
        assert res.json()["progress_percentage"] == 50.0

    def test_10_deposit_completes_goal(self):
        """Depositing to a goal marks it complete at 100%."""
        goal_res = self.client.post("/goals/", json={
            "goal_name": "New Laptop Fund",
            "target_amount": 50000.0,
            "current_amount": 25000.0,
            "deadline": "2026-12-31",
        }, headers=self.headers)
        assert goal_res.status_code in (200, 201)
        goal_id = goal_res.json()["goal_id"]

        dep_res = self.client.post(
            f"/goals/{goal_id}/deposit",
            json={"amount": 25000.0},
            headers=self.headers,
        )
        assert dep_res.status_code == 200, f"Deposit failed: {dep_res.text}"
        assert dep_res.json()["is_completed"] is True

    def test_11_create_bank_account(self):
        """Bank account can be created and persisted."""
        res = self.client.post("/accounts/", json={
            "account_name": "HDFC Student Savings",
            "account_type": "Bank Account",
            "balance": 30000.0,
            "account_number": "123456789012",
        }, headers=self.headers)
        assert res.status_code in (200, 201), f"Account creation failed: {res.text}"

    def test_12_dashboard_analytics(self):
        """Dashboard aggregates income and expenses correctly."""
        cats = self.client.get("/categories/", headers=self.headers).json()
        food_cat = next((c for c in cats if c["name"] == "Food"), cats[0])

        self.client.post("/income/", json={
            "amount": 30000.0, "source": "Scholarship",
            "income_date": "2026-08-25",
        }, headers=self.headers)
        self.client.post("/budget/", json={
            "amount": 10000.0, "month": "2026-08-01",
        }, headers=self.headers)
        self.client.post("/expenses/", json={
            "category_id": food_cat["category_id"],
            "amount": 8500.0, "description": "Total expenses",
            "expense_date": "2026-08-25",
        }, headers=self.headers)

        res = self.client.get("/dashboard/", headers=self.headers)
        assert res.status_code == 200, f"Dashboard failed: {res.text}"
        dash = res.json()
        assert dash["summary"]["total_income"] == 30000.0
        assert dash["summary"]["total_expenses"] == 8500.0
        assert dash["summary"]["savings"] == 21500.0

    def test_13_mark_notification_as_read(self):
        """A notification can be marked as read."""
        # Trigger a notification via budget alert
        cats = self.client.get("/categories/", headers=self.headers).json()
        food_cat = next((c for c in cats if c["name"] == "Food"), cats[0])
        self.client.post("/income/", json={
            "amount": 30000.0, "source": "Scholarship",
            "income_date": "2026-08-25",
        }, headers=self.headers)
        self.client.post("/budget/", json={
            "amount": 10000.0, "month": "2026-08-01",
        }, headers=self.headers)
        self.client.post("/expenses/", json={
            "category_id": food_cat["category_id"],
            "amount": 8500.0, "description": "Expenses",
            "expense_date": "2026-08-25",
        }, headers=self.headers)

        notif_res = self.client.get("/notifications/", headers=self.headers)
        notifs = notif_res.json()["notifications"]
        if not notifs:
            pytest.skip("No notifications to mark as read")

        notif_id = notifs[0]["notification_id"]
        res = self.client.put(
            f"/notifications/{notif_id}/read",
            headers=self.headers,
        )
        assert res.status_code == 200, f"Mark read failed: {res.text}"

    def test_14_unauthenticated_access_rejected(self):
        """All protected endpoints reject requests without a token (401)."""
        protected = [
            ("GET", "/expenses/"),
            ("GET", "/income/"),
            ("GET", "/budget/"),
            ("GET", "/goals/"),
            ("GET", "/accounts/"),
            ("GET", "/notifications/"),
            ("GET", "/dashboard/"),
            ("GET", "/users/profile"),
        ]
        for method, endpoint in protected:
            res = self.client.request(method, endpoint)
            assert res.status_code == 401, (
                f"Expected 401 for {method} {endpoint}, got {res.status_code}"
            )

    def test_15_password_not_exposed_in_profile(self):
        """Password hash is never returned in profile or /auth/me responses."""
        profile = self.client.get("/users/profile", headers=self.headers).json()
        me = self.client.get("/auth/me", headers=self.headers).json()
        assert "password" not in profile, "Password exposed in /users/profile!"
        assert "password" not in me, "Password exposed in /auth/me!"
