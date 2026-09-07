import pytest
from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.account import Account
from app.models.category import Category
from app.models.notification import Notification
from app.models.financial_goal import FinancialGoal
from app.models.goal_contribution import GoalContribution
from app.models.premium_request import PremiumRequest
from app.core.security import hash_password


class TestAdminDeleteUser:
    """
    Tests for secure user deletion in Admin User Management:
    - Protected endpoint: only authenticated ADMIN can delete users (401 / 403).
    - Prevents deleting any ADMIN account (400).
    - Prevents admin from deleting their own account (400).
    - Successfully deletes USER and PREMIUM_USER accounts.
    - Safely cascades deletion of related financial records for the target user only.
    - Does NOT modify or delete another user's financial records.
    """

    def test_unauthenticated_delete_rejected(self, client):
        """Unauthenticated delete request must return 401."""
        res = client.delete("/admin/users/999")
        assert res.status_code == 401

    def test_regular_user_delete_rejected(self, client, auth_headers):
        """Regular USER cannot delete another user (403 Forbidden)."""
        res = client.delete("/admin/users/999", headers=auth_headers)
        assert res.status_code == 403

    def test_premium_user_delete_rejected(self, client, db_session):
        """PREMIUM_USER cannot delete another user (403 Forbidden)."""
        prem_user = User(
            name="Prem Tester",
            email="prem_tester@test.local",
            password=hash_password("Pass123!"),
            role="PREMIUM_USER"
        )
        db_session.add(prem_user)
        db_session.commit()

        login_res = client.post(
            "/auth/login",
            data={"username": "prem_tester@test.local", "password": "Pass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        prem_headers = {"Authorization": f"Bearer {token}"}

        res = client.delete("/admin/users/999", headers=prem_headers)
        assert res.status_code == 403

    def test_admin_cannot_delete_self(self, client, admin_headers, db_session):
        """Admin cannot delete their own account (400 Bad Request)."""
        # Get admin user ID from /auth/me
        me_res = client.get("/auth/me", headers=admin_headers)
        assert me_res.status_code == 200
        admin_id = me_res.json()["user_id"]

        res = client.delete(f"/admin/users/{admin_id}", headers=admin_headers)
        assert res.status_code == 400
        assert "own account" in res.json()["detail"].lower()

    def test_admin_cannot_delete_another_admin(self, client, admin_headers, db_session):
        """Admin cannot delete another ADMIN account (400 Bad Request)."""
        another_admin = User(
            name="Second Admin",
            email="admin2@test.local",
            password=hash_password("AdminPass2!"),
            role="ADMIN"
        )
        db_session.add(another_admin)
        db_session.commit()

        res = client.delete(f"/admin/users/{another_admin.user_id}", headers=admin_headers)
        assert res.status_code == 400
        assert "administrator" in res.json()["detail"].lower()

    def test_delete_nonexistent_user_returns_404(self, client, admin_headers):
        """Deleting a non-existent user returns 404."""
        res = client.delete("/admin/users/999999", headers=admin_headers)
        assert res.status_code == 404
        assert "not found" in res.json()["detail"].lower()

    def test_admin_successfully_deletes_user_and_related_records(self, client, admin_headers, db_session):
        """
        Admin deletes a USER account.
        Verifies:
        - Target user's account, categories, income, expenses, budgets, goals, notifications are removed.
        - Other users' data remains completely intact.
        """
        # Create Target User A (USER)
        user_a = User(
            name="Alice To Delete",
            email="alice_delete@test.local",
            password=hash_password("Alice123!"),
            role="USER"
        )
        # Create User B (retained user)
        user_b = User(
            name="Bob Keeper",
            email="bob_keep@test.local",
            password=hash_password("Bob123!"),
            role="USER"
        )
        db_session.add_all([user_a, user_b])
        db_session.commit()

        # Add records for Alice (User A)
        cat_a = Category(user_id=user_a.user_id, name="Alice Cat")
        db_session.add(cat_a)
        db_session.commit()

        acc_a = Account(user_id=user_a.user_id, account_name="Alice Bank", account_type="Savings", balance=5000)
        from datetime import date
        inc_a = Income(user_id=user_a.user_id, amount=10000.0, source="Salary", income_date=date(2026, 8, 1))
        exp_a = Expense(user_id=user_a.user_id, category_id=cat_a.category_id, amount=2000.0, expense_date=date(2026, 8, 2))
        bud_a = Budget(user_id=user_a.user_id, amount=8000.0, month=date(2026, 8, 1))
        notif_a = Notification(user_id=user_a.user_id, title="Alice Notif", message="Test message")
        goal_a = FinancialGoal(user_id=user_a.user_id, goal_name="Alice Goal", target_amount=50000, current_amount=5000)
        db_session.add_all([acc_a, inc_a, exp_a, bud_a, notif_a, goal_a])
        db_session.commit()

        contrib_a = GoalContribution(goal_id=goal_a.goal_id, user_id=user_a.user_id, amount=1000)
        req_a = PremiumRequest(user_id=user_a.user_id, status="PENDING")
        db_session.add_all([contrib_a, req_a])
        db_session.commit()

        # Add records for Bob (User B)
        cat_b = Category(user_id=user_b.user_id, name="Bob Cat")
        db_session.add(cat_b)
        db_session.commit()

        inc_b = Income(user_id=user_b.user_id, amount=25000.0, source="Bob Job", income_date=date(2026, 8, 1))
        exp_b = Expense(user_id=user_b.user_id, category_id=cat_b.category_id, amount=3000.0, expense_date=date(2026, 8, 2))
        acc_b = Account(user_id=user_b.user_id, account_name="Bob Bank", account_type="Checking", balance=15000)
        db_session.add_all([inc_b, exp_b, acc_b])
        db_session.commit()

        # Execute DELETE via admin endpoint
        res = client.delete(f"/admin/users/{user_a.user_id}", headers=admin_headers)
        assert res.status_code == 200
        assert f"User '{user_a.name}' has been successfully deleted." in res.json()["message"]

        # Verify User A is completely gone
        assert db_session.query(User).filter(User.user_id == user_a.user_id).first() is None
        assert db_session.query(Category).filter(Category.user_id == user_a.user_id).first() is None
        assert db_session.query(Income).filter(Income.user_id == user_a.user_id).first() is None
        assert db_session.query(Expense).filter(Expense.user_id == user_a.user_id).first() is None
        assert db_session.query(Budget).filter(Budget.user_id == user_a.user_id).first() is None
        assert db_session.query(Account).filter(Account.user_id == user_a.user_id).first() is None
        assert db_session.query(Notification).filter(Notification.user_id == user_a.user_id).first() is None
        assert db_session.query(FinancialGoal).filter(FinancialGoal.user_id == user_a.user_id).first() is None
        assert db_session.query(GoalContribution).filter(GoalContribution.user_id == user_a.user_id).first() is None
        assert db_session.query(PremiumRequest).filter(PremiumRequest.user_id == user_a.user_id).first() is None

        # Verify User B and Bob's financial records are untouched!
        assert db_session.query(User).filter(User.user_id == user_b.user_id).first() is not None
        assert db_session.query(Category).filter(Category.user_id == user_b.user_id).count() == 1
        assert db_session.query(Income).filter(Income.user_id == user_b.user_id).count() == 1
        assert db_session.query(Expense).filter(Expense.user_id == user_b.user_id).count() == 1
        assert db_session.query(Account).filter(Account.user_id == user_b.user_id).count() == 1

    def test_admin_successfully_deletes_premium_user(self, client, admin_headers, db_session):
        """Admin successfully deletes a PREMIUM_USER account."""
        prem_user = User(
            name="Charlie Premium",
            email="charlie_prem@test.local",
            password=hash_password("Char123!"),
            role="PREMIUM_USER"
        )
        db_session.add(prem_user)
        db_session.commit()

        res = client.delete(f"/admin/users/{prem_user.user_id}", headers=admin_headers)
        assert res.status_code == 200
        assert db_session.query(User).filter(User.user_id == prem_user.user_id).first() is None

    def test_user_management_statistics_update_after_deletion(self, client, admin_headers, db_session):
        """
        Verifies that after deleting a USER and a PREMIUM_USER,
        user management directory counts (Total, Student, Premium) update accurately.
        """
        # Create standard student user
        u1 = User(name="Student S1", email="s1@test.local", password=hash_password("Pass1!"), role="USER")
        # Create premium user
        u2 = User(name="Premium P1", email="p1@test.local", password=hash_password("Pass2!"), role="PREMIUM_USER")
        db_session.add_all([u1, u2])
        db_session.commit()

        # Check list before deletion
        list_before = client.get("/admin/users", headers=admin_headers).json()
        total_before = len(list_before)
        students_before = len([u for u in list_before if u["role"] == "USER"])
        premium_before = len([u for u in list_before if u["role"] == "PREMIUM_USER"])

        # Delete student user
        del1 = client.delete(f"/admin/users/{u1.user_id}", headers=admin_headers)
        assert del1.status_code == 200

        # Query after student deletion
        list_mid = client.get("/admin/users", headers=admin_headers).json()
        assert len(list_mid) == total_before - 1
        assert len([u for u in list_mid if u["role"] == "USER"]) == students_before - 1
        assert len([u for u in list_mid if u["role"] == "PREMIUM_USER"]) == premium_before

        # Delete premium user
        del2 = client.delete(f"/admin/users/{u2.user_id}", headers=admin_headers)
        assert del2.status_code == 200

        # Query after premium deletion
        list_after = client.get("/admin/users", headers=admin_headers).json()
        assert len(list_after) == total_before - 2
        assert len([u for u in list_after if u["role"] == "USER"]) == students_before - 1
        assert len([u for u in list_after if u["role"] == "PREMIUM_USER"]) == premium_before - 1

    def test_existing_premium_approval_workflow_unaffected(self, client, admin_headers, db_session):
        """
        Verifies that the existing Premium approval / rejection workflow remains 100% functional:
        - Approve sets role to PREMIUM_USER and sends notification.
        - Reject sets status to REJECTED and leaves role as USER.
        """
        target_user = User(
            name="Requester User",
            email="requester@test.local",
            password=hash_password("Req123!"),
            role="USER"
        )
        db_session.add(target_user)
        db_session.commit()

        req = PremiumRequest(
            user_id=target_user.user_id,
            status="PENDING"
        )
        db_session.add(req)
        db_session.commit()

        # Approve request
        appr_res = client.post(f"/admin/premium-requests/{req.request_id}/approve", headers=admin_headers)
        assert appr_res.status_code == 200
        assert appr_res.json()["new_role"] == "PREMIUM_USER"

        db_session.refresh(target_user)
        assert target_user.role == "PREMIUM_USER"
        db_session.refresh(req)
        assert req.status == "APPROVED"

        # Notification was dispatched
        notif = db_session.query(Notification).filter(Notification.user_id == target_user.user_id).first()
        assert notif is not None
        assert "Premium Upgrade Approved" in notif.title

