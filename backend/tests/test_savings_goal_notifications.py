import pytest
from app.models.notification import Notification


class TestSavingsGoalNotifications:
    """
    Test suite verifying integration between Savings Goals and Notifications system.
    """

    def test_01_create_savings_goal_notification(self, client, auth_headers):
        """
        1. SAVINGS GOAL CREATED
        Creating a new Savings Goal must automatically create a notification:
        Title: 'New Savings Goal Created'
        Message: \"Your savings goal 'New Laptop Fund' has been created successfully.\"
        """
        goal_name = "New Laptop Fund"
        res = client.post(
            "/goals/",
            json={
                "goal_name": goal_name,
                "target_amount": 50000.0,
                "current_amount": 5000.0,
                "deadline": "2026-12-31",
            },
            headers=auth_headers,
        )
        assert res.status_code in (200, 201), f"Goal creation failed: {res.text}"

        notif_res = client.get("/notifications/", headers=auth_headers)
        assert notif_res.status_code == 200
        notifs = notif_res.json()["notifications"]

        created_notifs = [
            n for n in notifs if n["title"] == "New Savings Goal Created"
        ]
        assert len(created_notifs) == 1
        assert created_notifs[0]["message"] == f"Your savings goal '{goal_name}' has been created successfully."
        assert notif_res.json()["unread_count"] >= 1

    def test_02_update_savings_goal_notification(self, client, auth_headers):
        """
        2. SAVINGS GOAL UPDATED
        Editing an existing Savings Goal must automatically create a notification:
        Title: 'Savings Goal Updated'
        Message: \"Your savings goal 'Higher Studies Fund' has been updated successfully.\"
        """
        create_res = client.post(
            "/goals/",
            json={
                "goal_name": "Study Fund",
                "target_amount": 80000.0,
                "current_amount": 10000.0,
            },
            headers=auth_headers,
        )
        assert create_res.status_code in (200, 201)
        goal_id = create_res.json()["goal_id"]

        updated_name = "Higher Studies Fund"
        update_res = client.put(
            f"/goals/{goal_id}",
            json={
                "goal_name": updated_name,
                "target_amount": 90000.0,
                "current_amount": 15000.0,
            },
            headers=auth_headers,
        )
        assert update_res.status_code == 200

        notif_res = client.get("/notifications/", headers=auth_headers)
        assert notif_res.status_code == 200
        notifs = notif_res.json()["notifications"]

        update_notifs = [
            n for n in notifs if n["title"] == "Savings Goal Updated"
        ]
        assert len(update_notifs) == 1
        assert update_notifs[0]["message"] == f"Your savings goal '{updated_name}' has been updated successfully."

    def test_03_money_added_to_savings_goal(self, client, auth_headers):
        """
        3. MONEY ADDED TO SAVINGS GOAL
        When money is deposited, create notification:
        Title: 'Money Added to Savings Goal'
        Message: \"₹5,000 has been added to your savings goal 'New Laptop Fund'.\"
        """
        goal_name = "New Laptop Fund"
        create_res = client.post(
            "/goals/",
            json={
                "goal_name": goal_name,
                "target_amount": 50000.0,
                "current_amount": 10000.0,
            },
            headers=auth_headers,
        )
        assert create_res.status_code in (200, 201)
        goal_id = create_res.json()["goal_id"]

        dep_res = client.post(
            f"/goals/{goal_id}/deposit",
            json={"amount": 5000.0},
            headers=auth_headers,
        )
        assert dep_res.status_code == 200

        notif_res = client.get("/notifications/", headers=auth_headers)
        assert notif_res.status_code == 200
        notifs = notif_res.json()["notifications"]

        deposit_notifs = [
            n for n in notifs if n["title"] == "Money Added to Savings Goal"
        ]
        assert len(deposit_notifs) == 1
        assert deposit_notifs[0]["message"] == f"₹5,000 has been added to your savings goal '{goal_name}'."

    def test_04_target_achieved_notification(self, client, auth_headers):
        """
        4. SAVINGS GOAL TARGET ACHIEVED
        When saved amount reaches or exceeds target, create notification:
        Title: 'Savings Goal Achieved 🎉'
        Message: \"Congratulations! Your savings goal 'New Laptop Fund' has been achieved.\"
        Must trigger once.
        """
        goal_name = "New Laptop Fund"
        create_res = client.post(
            "/goals/",
            json={
                "goal_name": goal_name,
                "target_amount": 20000.0,
                "current_amount": 15000.0,
            },
            headers=auth_headers,
        )
        assert create_res.status_code in (200, 201)
        goal_id = create_res.json()["goal_id"]

        # Deposit enough to reach target (15,000 + 5,000 = 20,000)
        dep_res = client.post(
            f"/goals/{goal_id}/deposit",
            json={"amount": 5000.0},
            headers=auth_headers,
        )
        assert dep_res.status_code == 200
        assert dep_res.json()["is_completed"] is True

        notif_res = client.get("/notifications/", headers=auth_headers)
        assert notif_res.status_code == 200
        notifs = notif_res.json()["notifications"]

        # Should have both "Money Added to Savings Goal" and "Savings Goal Achieved 🎉"
        money_added = [n for n in notifs if n["title"] == "Money Added to Savings Goal"]
        achieved = [n for n in notifs if n["title"] == "Savings Goal Achieved 🎉"]

        assert len(money_added) == 1
        assert money_added[0]["message"] == f"₹5,000 has been added to your savings goal '{goal_name}'."

        assert len(achieved) == 1
        assert achieved[0]["message"] == f"Congratulations! Your savings goal '{goal_name}' has been achieved."

    def test_05_no_duplicate_achievement_notification_on_refresh_or_subsequent_deposits(
        self, client, auth_headers
    ):
        """
        5. REFRESH & SUBSEQUENT DEPOSITS DO NOT DUPLICATE ACHIEVEMENT NOTIFICATION
        """
        goal_name = "Trip Fund"
        create_res = client.post(
            "/goals/",
            json={
                "goal_name": goal_name,
                "target_amount": 10000.0,
                "current_amount": 0.0,
            },
            headers=auth_headers,
        )
        goal_id = create_res.json()["goal_id"]

        # Reach target
        client.post(
            f"/goals/{goal_id}/deposit",
            json={"amount": 10000.0},
            headers=auth_headers,
        )

        # Simulate page refreshes (multiple GET /goals/ and GET /notifications/)
        client.get("/goals/", headers=auth_headers)
        client.get("/goals/", headers=auth_headers)
        client.get(f"/goals/{goal_id}", headers=auth_headers)
        client.get("/notifications/", headers=auth_headers)

        # Further deposit to already completed goal
        client.post(
            f"/goals/{goal_id}/deposit",
            json={"amount": 2000.0},
            headers=auth_headers,
        )

        notif_res = client.get("/notifications/", headers=auth_headers)
        notifs = notif_res.json()["notifications"]

        achieved_notifs = [
            n for n in notifs if n["title"] == "Savings Goal Achieved 🎉"
        ]
        assert len(achieved_notifs) == 1, f"Duplicate achievement notifications created: {achieved_notifs}"

    def test_06_target_achieved_via_update(self, client, auth_headers):
        """
        Target achieved when editing target or current amount via update
        """
        goal_name = "Camera Fund"
        create_res = client.post(
            "/goals/",
            json={
                "goal_name": goal_name,
                "target_amount": 50000.0,
                "current_amount": 30000.0,
            },
            headers=auth_headers,
        )
        goal_id = create_res.json()["goal_id"]

        # Update target amount to 30000 so current reaches target
        update_res = client.put(
            f"/goals/{goal_id}",
            json={
                "target_amount": 30000.0,
            },
            headers=auth_headers,
        )
        assert update_res.status_code == 200
        assert update_res.json()["is_completed"] is True

        notif_res = client.get("/notifications/", headers=auth_headers)
        notifs = notif_res.json()["notifications"]

        achieved = [n for n in notifs if n["title"] == "Savings Goal Achieved 🎉"]
        assert len(achieved) == 1
        assert achieved[0]["message"] == f"Congratulations! Your savings goal '{goal_name}' has been achieved."

    def test_07_existing_notifications_continue_working(self, client, auth_headers):
        """
        7. VERIFY EXISTING NOTIFICATIONS
        Income, expense, and budget notifications continue working alongside savings goals.
        """
        # 1. Income notification
        inc_res = client.post(
            "/income/",
            json={
                "amount": 25000.0,
                "source": "Stipend",
                "income_date": "2026-08-01",
            },
            headers=auth_headers,
        )
        assert inc_res.status_code in (200, 201)

        # 2. Budget notification
        bud_res = client.post(
            "/budget/",
            json={
                "amount": 10000.0,
                "month": "2026-08-01",
            },
            headers=auth_headers,
        )
        assert bud_res.status_code in (200, 201)

        # 3. Savings Goal notification
        goal_res = client.post(
            "/goals/",
            json={
                "goal_name": "Emergency Fund",
                "target_amount": 15000.0,
                "current_amount": 5000.0,
            },
            headers=auth_headers,
        )
        assert goal_res.status_code in (200, 201)

        notif_res = client.get("/notifications/", headers=auth_headers)
        assert notif_res.status_code == 200
        notifs = notif_res.json()["notifications"]

        has_income = any("Income" in n["title"] for n in notifs)
        has_budget = any("Budget" in n["title"] for n in notifs)
        has_goal = any("Savings Goal" in n["title"] for n in notifs)

        assert has_income, "Existing Income notification missing"
        assert has_budget, "Existing Budget notification missing"
        assert has_goal, "New Savings Goal notification missing"

    def test_08_multi_user_isolation(self, client):
        """
        8. MULTI-USER ISOLATION
        User A's savings goal notifications must NEVER appear for User B.
        """
        # Register User A
        reg_a = client.post(
            "/auth/register",
            json={"name": "Alice User", "email": "alice_goal@test.com", "password": "Password123!"},
        )
        assert reg_a.status_code in (200, 201)
        login_a = client.post(
            "/auth/login",
            data={"username": "alice_goal@test.com", "password": "Password123!"},
        )
        head_a = {"Authorization": f"Bearer {login_a.json()['access_token']}"}

        # Register User B
        reg_b = client.post(
            "/auth/register",
            json={"name": "Bob User", "email": "bob_goal@test.com", "password": "Password123!"},
        )
        assert reg_b.status_code in (200, 201)
        login_b = client.post(
            "/auth/login",
            data={"username": "bob_goal@test.com", "password": "Password123!"},
        )
        head_b = {"Authorization": f"Bearer {login_b.json()['access_token']}"}

        # User A creates a savings goal
        client.post(
            "/goals/",
            json={"goal_name": "Alice Private Goal", "target_amount": 50000.0, "current_amount": 0.0},
            headers=head_a,
        )

        # User A should see the notification
        notifs_a = client.get("/notifications/", headers=head_a).json()["notifications"]
        assert any("Alice Private Goal" in n["message"] for n in notifs_a)

        # User B must NOT see Alice's notification
        notifs_b = client.get("/notifications/", headers=head_b).json()["notifications"]
        assert not any("Alice Private Goal" in n["message"] for n in notifs_b)

    def test_09_error_handling_notification_failure_does_not_break_goal(
        self, client, auth_headers, monkeypatch
    ):
        """
        9. ERROR HANDLING
        If notification creation fails (e.g. database error inside notification helper),
        the goal operation must still succeed without breaking.
        """
        from app.routers import financial_goals

        def fail_create_notif(*args, **kwargs):
            raise RuntimeError("Simulated notification service failure")

        monkeypatch.setattr(financial_goals, "_safe_create_notification", fail_create_notif)

        # Creating goal should still succeed (201 Created)
        res = client.post(
            "/goals/",
            json={
                "goal_name": "Resilient Goal",
                "target_amount": 30000.0,
                "current_amount": 5000.0,
            },
            headers=auth_headers,
        )
        assert res.status_code in (200, 201), f"Goal creation failed when notification errored: {res.text}"
        assert res.json()["goal_name"] == "Resilient Goal"
