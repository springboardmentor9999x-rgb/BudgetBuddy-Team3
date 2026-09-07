"""
BudgetBuddy — Security & Data Isolation Test Suite (pytest version)
====================================================================
Replaces the original test_security.py that hit the live server.

Verifies:
  1. User A and User B are fully isolated from each other's data.
  2. Unauthorized cross-user access returns 404 on all resource types.
  3. Unauthenticated requests return 401 on all protected endpoints.
  4. Password hashes are never exposed in any API response.

ALL requests go through the FastAPI TestClient against an isolated
SQLite test database. The live PostgreSQL database is never contacted.
"""

import time
import pytest


# ============================================================
# HELPERS
# ============================================================

def register_and_login(client, name: str, email: str, password: str) -> str:
    """Register a user and return a Bearer token string."""
    reg = client.post("/auth/register", json={
        "name": name, "email": email, "password": password,
    })
    assert reg.status_code in (200, 201), f"Registration failed for {email}: {reg.text}"

    login = client.post(
        "/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, f"Login failed for {email}: {login.text}"
    return login.json()["access_token"]


# ============================================================
# SECURITY & ISOLATION TEST CLASS
# ============================================================

class TestSecurityAndIsolation:
    """
    Mirrors the original test_security.py run_security_test() function.
    Each concern is a separate test method.
    """

    @pytest.fixture(autouse=True)
    def setup_users(self, client):
        """Register Alice and Bob once per test method."""
        self.client = client
        ts = int(time.time() * 1000)

        self.email_a = f"usera_{ts}@security.test"
        self.email_b = f"userb_{ts}@security.test"
        self.pwd = "TestPassword123!"

        tok_a = register_and_login(client, "Alice", self.email_a, self.pwd)
        tok_b = register_and_login(client, "Bob", self.email_b, self.pwd)

        self.head_a = {"Authorization": f"Bearer {tok_a}"}
        self.head_b = {"Authorization": f"Bearer {tok_b}"}

        # ── Alice creates resources ──────────────────────────────────────────
        # Ensure Alice has categories
        client.get("/categories/", headers=self.head_a)
        cats_a = client.get("/categories/", headers=self.head_a).json()
        self.cat_id_a = cats_a[0]["category_id"]

        # Expense
        exp_res = client.post("/expenses/", json={
            "category_id": self.cat_id_a,
            "amount": 1500,
            "description": "Alice Confidential",
            "expense_date": "2026-08-25",
        }, headers=self.head_a)
        assert exp_res.status_code in (200, 201), f"Alice expense failed: {exp_res.text}"
        self.exp_id_a = exp_res.json()["expense_id"]

        # Income
        inc_res = client.post("/income/", json={
            "amount": 50000, "source": "Alice Salary",
            "income_date": "2026-08-25",
        }, headers=self.head_a)
        assert inc_res.status_code in (200, 201), f"Alice income failed: {inc_res.text}"
        self.inc_id_a = inc_res.json()["income_id"]

        # Budget
        bud_res = client.post("/budget/", json={
            "amount": 25000, "month": "2026-08-01",
        }, headers=self.head_a)
        assert bud_res.status_code in (200, 201), f"Alice budget failed: {bud_res.text}"
        self.bud_id_a = bud_res.json()["budget_id"]

        # Goal
        goal_res = client.post("/goals/", json={
            "goal_name": "Alice Secret Goal", "target_amount": 100000,
        }, headers=self.head_a)
        assert goal_res.status_code in (200, 201), f"Alice goal failed: {goal_res.text}"
        self.goal_id_a = goal_res.json()["goal_id"]

        # Account
        acc_res = client.post("/accounts/", json={
            "account_name": "Alice Private Bank",
            "account_type": "Bank Account",
            "balance": 75000,
        }, headers=self.head_a)
        assert acc_res.status_code in (200, 201), f"Alice account failed: {acc_res.text}"
        self.acc_id_a = acc_res.json()["account_id"]

        # Get a notification ID for Alice (trigger one via a goal completion)
        goal_res2 = client.post("/goals/", json={
            "goal_name": "Fund for Notification Test",
            "target_amount": 1000,
            "current_amount": 0,
        }, headers=self.head_a)
        if goal_res2.status_code in (200, 201):
            g2_id = goal_res2.json()["goal_id"]
            client.post(f"/goals/{g2_id}/deposit", json={"amount": 1000}, headers=self.head_a)

        notifs_a = client.get("/notifications/", headers=self.head_a).json()
        self.notifs_a = notifs_a.get("notifications", [])
        self.notif_id_a = self.notifs_a[0]["notification_id"] if self.notifs_a else None

    # ── Cross-user isolation checks ──────────────────────────────────────────

    def test_bob_cannot_read_alice_expense(self):
        r = self.client.get(f"/expenses/{self.exp_id_a}", headers=self.head_b)
        assert r.status_code == 404, f"Security breach: Bob read Alice's expense: {r.text}"

    def test_bob_cannot_update_alice_expense(self):
        r = self.client.put(
            f"/expenses/{self.exp_id_a}",
            json={"amount": 99999, "description": "hacked", "expense_date": "2026-08-25",
                  "category_id": self.cat_id_a},
            headers=self.head_b,
        )
        assert r.status_code == 404, f"Security breach: Bob updated Alice's expense: {r.text}"

    def test_bob_cannot_delete_alice_expense(self):
        r = self.client.delete(f"/expenses/{self.exp_id_a}", headers=self.head_b)
        assert r.status_code == 404, f"Security breach: Bob deleted Alice's expense: {r.text}"

    def test_bob_cannot_read_alice_income(self):
        r = self.client.get(f"/income/{self.inc_id_a}", headers=self.head_b)
        assert r.status_code == 404, f"Security breach: Bob read Alice's income: {r.text}"

    def test_bob_cannot_delete_alice_income(self):
        r = self.client.delete(f"/income/{self.inc_id_a}", headers=self.head_b)
        assert r.status_code == 404, f"Security breach: Bob deleted Alice's income: {r.text}"

    def test_bob_cannot_read_alice_goal(self):
        r = self.client.get(f"/goals/{self.goal_id_a}", headers=self.head_b)
        assert r.status_code == 404, f"Security breach: Bob read Alice's goal: {r.text}"

    def test_bob_cannot_deposit_to_alice_goal(self):
        r = self.client.post(
            f"/goals/{self.goal_id_a}/deposit",
            json={"amount": 500},
            headers=self.head_b,
        )
        assert r.status_code == 404, f"Security breach: Bob deposited to Alice's goal: {r.text}"

    def test_bob_cannot_delete_alice_account(self):
        r = self.client.delete(f"/accounts/{self.acc_id_a}", headers=self.head_b)
        assert r.status_code == 404, f"Security breach: Bob deleted Alice's account: {r.text}"

    def test_bob_cannot_delete_alice_budget(self):
        r = self.client.delete(f"/budget/{self.bud_id_a}", headers=self.head_b)
        assert r.status_code == 404, f"Security breach: Bob deleted Alice's budget: {r.text}"

    def test_bob_cannot_mark_alice_notification_read(self):
        if self.notif_id_a is None:
            pytest.skip("No notification created for Alice in this run")
        r = self.client.put(
            f"/notifications/{self.notif_id_a}/read", headers=self.head_b
        )
        assert r.status_code == 404, (
            f"Security breach: Bob modified Alice's notification: {r.text}"
        )

    def test_bob_dashboard_does_not_leak_alice_data(self):
        """Bob's dashboard shows only his own data — zero income/expenses."""
        dash_b = self.client.get("/dashboard/", headers=self.head_b).json()
        assert dash_b["summary"]["total_income"] == 0.0, (
            f"Bob's dashboard leaked Alice's income: {dash_b['summary']['total_income']}"
        )
        assert dash_b["summary"]["total_expenses"] == 0.0, (
            f"Bob's dashboard leaked Alice's expenses: {dash_b['summary']['total_expenses']}"
        )

    # ── Unauthenticated access checks ────────────────────────────────────────

    def test_unauthenticated_expenses_rejected(self):
        assert self.client.get("/expenses/").status_code == 401

    def test_unauthenticated_income_rejected(self):
        assert self.client.get("/income/").status_code == 401

    def test_unauthenticated_budget_rejected(self):
        assert self.client.get("/budget/").status_code == 401

    def test_unauthenticated_goals_rejected(self):
        assert self.client.get("/goals/").status_code == 401

    def test_unauthenticated_accounts_rejected(self):
        assert self.client.get("/accounts/").status_code == 401

    def test_unauthenticated_notifications_rejected(self):
        assert self.client.get("/notifications/").status_code == 401

    def test_unauthenticated_dashboard_rejected(self):
        assert self.client.get("/dashboard/").status_code == 401

    def test_unauthenticated_profile_rejected(self):
        assert self.client.get("/users/profile").status_code == 401

    # ── Password exposure checks ─────────────────────────────────────────────

    def test_password_not_exposed_in_profile(self):
        profile_a = self.client.get("/users/profile", headers=self.head_a).json()
        assert "password" not in profile_a, "Password exposed in /users/profile!"

    def test_password_not_exposed_in_auth_me(self):
        me_a = self.client.get("/auth/me", headers=self.head_a).json()
        assert "password" not in me_a, "Password exposed in /auth/me!"
