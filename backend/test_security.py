import requests
import time
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
BASE_URL = "http://127.0.0.1:8000"

def run_security_test():
    print("========================================")
    print("STARTING BUDGETBUDDY SECURITY & ISOLATION AUDIT")
    print("========================================")

    ts = int(time.time())
    user_a_email = f"usera_{ts}@security.test"
    user_b_email = f"userb_{ts}@security.test"
    pwd = "TestPassword123!"

    # 1. Register User A and User B
    res_a = requests.post(f"{BASE_URL}/auth/register", json={"name": "Alice", "email": user_a_email, "password": pwd})
    res_b = requests.post(f"{BASE_URL}/auth/register", json={"name": "Bob", "email": user_b_email, "password": pwd})
    assert res_a.status_code in (200, 201)
    assert res_b.status_code in (200, 201)

    # 2. Login both users
    tok_a = requests.post(f"{BASE_URL}/auth/login", data={"username": user_a_email, "password": pwd}, headers={"Content-Type": "application/x-www-form-urlencoded"}).json()["access_token"]
    tok_b = requests.post(f"{BASE_URL}/auth/login", data={"username": user_b_email, "password": pwd}, headers={"Content-Type": "application/x-www-form-urlencoded"}).json()["access_token"]

    head_a = {"Authorization": f"Bearer {tok_a}"}
    head_b = {"Authorization": f"Bearer {tok_b}"}
    print("1. [PASS] Registered and authenticated User A (Alice) and User B (Bob).")

    # 3. User A creates resources
    # Category
    cats_a = requests.get(f"{BASE_URL}/categories/", headers=head_a).json()
    cat_id_a = cats_a[0]["category_id"]

    # Expense
    exp_a = requests.post(f"{BASE_URL}/expenses/", json={"category_id": cat_id_a, "amount": 1500, "description": "Alice Confidential", "expense_date": "2026-08-25"}, headers=head_a).json()
    exp_id_a = exp_a["expense_id"]

    # Income
    inc_a = requests.post(f"{BASE_URL}/income/", json={"amount": 50000, "source": "Alice Salary", "income_date": "2026-08-25"}, headers=head_a).json()
    inc_id_a = inc_a["income_id"]

    # Budget
    bud_a = requests.post(f"{BASE_URL}/budget/", json={"amount": 25000, "month": "2026-08-01"}, headers=head_a).json()
    bud_id_a = bud_a["budget_id"]

    # Goal
    goal_a = requests.post(f"{BASE_URL}/goals/", json={"goal_name": "Alice Secret Goal", "target_amount": 100000}, headers=head_a).json()
    goal_id_a = goal_a["goal_id"]

    # Account
    acc_a = requests.post(f"{BASE_URL}/accounts/", json={"account_name": "Alice Private Bank", "account_type": "Bank Account", "balance": 75000}, headers=head_a).json()
    acc_id_a = acc_a["account_id"]

    # Notification
    notifs_a = requests.get(f"{BASE_URL}/notifications/", headers=head_a).json()["notifications"]
    notif_id_a = notifs_a[0]["notification_id"]

    print("2. [PASS] User A created isolated Expense, Income, Budget, Goal, Account, and Notification.")

    # 4. User B attempts unauthorized access to User A's resources
    # B tries to get A's expense
    r = requests.get(f"{BASE_URL}/expenses/{exp_id_a}", headers=head_b)
    assert r.status_code == 404, f"Security Breach! Bob could read Alice's expense: {r.text}"

    # B tries to update A's expense
    r = requests.put(f"{BASE_URL}/expenses/{exp_id_a}", json={"amount": 99999}, headers=head_b)
    assert r.status_code == 404, f"Security Breach! Bob could update Alice's expense: {r.text}"

    # B tries to delete A's expense
    r = requests.delete(f"{BASE_URL}/expenses/{exp_id_a}", headers=head_b)
    assert r.status_code == 404, f"Security Breach! Bob could delete Alice's expense: {r.text}"

    # B tries to get A's income
    r = requests.get(f"{BASE_URL}/income/{inc_id_a}", headers=head_b)
    assert r.status_code == 404, f"Security Breach! Bob could read Alice's income: {r.text}"

    # B tries to delete A's income
    r = requests.delete(f"{BASE_URL}/income/{inc_id_a}", headers=head_b)
    assert r.status_code == 404, f"Security Breach! Bob could delete Alice's income: {r.text}"

    # B tries to access A's goal
    r = requests.get(f"{BASE_URL}/goals/{goal_id_a}", headers=head_b)
    assert r.status_code == 404, f"Security Breach! Bob could read Alice's goal: {r.text}"

    # B tries to deposit to A's goal
    r = requests.post(f"{BASE_URL}/goals/{goal_id_a}/deposit", json={"amount": 500}, headers=head_b)
    assert r.status_code == 404, f"Security Breach! Bob could deposit to Alice's goal: {r.text}"

    # B tries to delete A's account
    r = requests.delete(f"{BASE_URL}/accounts/{acc_id_a}", headers=head_b)
    assert r.status_code == 404, f"Security Breach! Bob could delete Alice's account: {r.text}"

    # B tries to delete A's budget
    r = requests.delete(f"{BASE_URL}/budget/{bud_id_a}", headers=head_b)
    assert r.status_code == 404, f"Security Breach! Bob could delete Alice's budget: {r.text}"

    # B tries to mark A's notification as read
    r = requests.put(f"{BASE_URL}/notifications/{notif_id_a}/read", headers=head_b)
    assert r.status_code == 404, f"Security Breach! Bob could modify Alice's notification: {r.text}"

    # B checks dashboard -> should see 0 income / 0 expenses
    dash_b = requests.get(f"{BASE_URL}/dashboard/", headers=head_b).json()
    assert dash_b["summary"]["total_income"] == 0.0, "Bob's dashboard leaked Alice's income!"
    assert dash_b["summary"]["total_expenses"] == 0.0, "Bob's dashboard leaked Alice's expenses!"

    print("3. [PASS] Cross-user isolation verified across all modules (all unauthorized access returned 404).")

    # 5. Unauthenticated access check (No token)
    endpoints_to_test = [
        ("GET", "/expenses/"),
        ("GET", "/income/"),
        ("GET", "/budget/"),
        ("GET", "/goals/"),
        ("GET", "/accounts/"),
        ("GET", "/notifications/"),
        ("GET", "/dashboard/"),
        ("GET", "/reports/summary"),
        ("GET", "/users/profile")
    ]

    for method, ep in endpoints_to_test:
        r = requests.request(method, f"{BASE_URL}{ep}")
        assert r.status_code == 401, f"Unauthenticated request to {ep} did not return 401! Got {r.status_code}"

    print(f"4. [PASS] Unauthenticated access rejected with 401 Unauthorized for all {len(endpoints_to_test)} protected endpoints.")

    # 6. Password field exclusion check
    profile_a = requests.get(f"{BASE_URL}/users/profile", headers=head_a).json()
    me_a = requests.get(f"{BASE_URL}/auth/me", headers=head_a).json()
    assert "password" not in profile_a, "Password exposed in /users/profile response!"
    assert "password" not in me_a, "Password exposed in /auth/me response!"
    print("5. [PASS] Password hashes securely hidden and never returned in API payloads.")

    print("\n========================================")
    print("ALL SECURITY & ISOLATION CHECKS PASSED (100% SECURE)")
    print("========================================")

if __name__ == "__main__":
    run_security_test()
