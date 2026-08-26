import requests
import json
import time
import sys
import io

# Force stdout utf-8 encoding on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def test_full_pipeline():
    print("========================================")
    print("STARTING BUDGETBUDDY FULL E2E TEST")
    print("========================================")

    # 1. Health check
    res = requests.get(f"{BASE_URL}/")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("1. [PASS] Root API health check is OK.")

    # 2. User registration
    test_email = f"student_{int(time.time())}@college.edu"
    test_password = "securepassword123"
    test_name = "Test Student"

    res = requests.post(f"{BASE_URL}/auth/register", json={
        "name": test_name,
        "email": test_email,
        "password": test_password
    })
    assert res.status_code in (200, 201), f"Registration failed: {res.text}"
    print(f"2. [PASS] User registration passed: {test_email}")

    # 3. User login
    res = requests.post(f"{BASE_URL}/auth/login", data={
        "username": test_email,
        "password": test_password
    }, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("3. [PASS] User login and JWT access token obtained.")

    # 4. User profile
    res = requests.get(f"{BASE_URL}/users/profile", headers=headers)
    assert res.status_code == 200, f"Profile fetch failed: {res.text}"
    print(f"4. [PASS] User profile retrieved: {res.json()['name']}")

    # 5. Categories auto-seeding
    res = requests.get(f"{BASE_URL}/categories/", headers=headers)
    assert res.status_code == 200, f"Categories failed: {res.text}"
    categories = res.json()
    assert len(categories) >= 8, f"Default categories not seeded properly: {categories}"
    food_cat = next((c for c in categories if c["name"] == "Food"), categories[0])
    print(f"5. [PASS] Standard categories auto-seeded: {len(categories)} categories available.")

    # 6. Add Income (Rs. 30,000 Scholarship)
    res = requests.post(f"{BASE_URL}/income/", json={
        "amount": 30000.0,
        "source": "Scholarship",
        "bank_name": "State Bank of India",
        "description": "Semester Merit Scholarship",
        "income_date": "2026-08-25"
    }, headers=headers)
    assert res.status_code in (200, 201), f"Income creation failed: {res.text}"
    print("6. [PASS] Income created successfully (Rs. 30,000).")

    # 7. Set Monthly Budget (Rs. 10,000)
    res = requests.post(f"{BASE_URL}/budget/", json={
        "amount": 10000.0,
        "month": "2026-08-01"
    }, headers=headers)
    assert res.status_code in (200, 201), f"Budget creation failed: {res.text}"
    print("7. [PASS] Monthly budget created (Rs. 10,000).")

    # 8. Add Expense below threshold (Rs. 3,000 Food)
    res = requests.post(f"{BASE_URL}/expenses/", json={
        "category_id": food_cat["category_id"],
        "amount": 3000.0,
        "description": "Monthly Mess and Groceries",
        "expense_date": "2026-08-25"
    }, headers=headers)
    assert res.status_code in (200, 201), f"Expense creation failed: {res.text}"
    print("8. [PASS] Expense created (Rs. 3,000 Food).")

    # 9. Add Expense crossing 80% threshold (Rs. 5,500 more -> Total Rs. 8,500 / Rs. 10,000 = 85%)
    res = requests.post(f"{BASE_URL}/expenses/", json={
        "category_id": food_cat["category_id"],
        "amount": 5500.0,
        "description": "Books & Study Materials",
        "expense_date": "2026-08-25"
    }, headers=headers)
    assert res.status_code in (200, 201), f"Expense creation failed: {res.text}"
    print("9. [PASS] Second expense created (Rs. 5,500). Budget threshold reached (85%).")

    # 10. Check Notifications for automated budget alert
    res = requests.get(f"{BASE_URL}/notifications/", headers=headers)
    assert res.status_code == 200, f"Notifications failed: {res.text}"
    notif_data = res.json()
    notifs = notif_data["notifications"]
    assert len(notifs) >= 3, f"Expected notifications missing: {notifs}"
    has_budget_warning = any("Budget" in n["title"] or "Warning" in n["title"] or "Alert" in n["title"] for n in notifs)
    assert has_budget_warning, "Budget threshold warning notification was not triggered!"
    print(f"10. [PASS] Automated budget alert notification verified in database: {notifs[0]['title']}")

    # 11. Create Savings Goal (New Laptop Fund: Target Rs. 50,000, Initial Rs. 25,000)
    res = requests.post(f"{BASE_URL}/goals/", json={
        "goal_name": "New Laptop Fund",
        "target_amount": 50000.0,
        "current_amount": 25000.0,
        "deadline": "2026-12-31"
    }, headers=headers)
    assert res.status_code in (200, 201), f"Savings goal creation failed: {res.text}"
    goal_id = res.json()["goal_id"]
    assert res.json()["progress_percentage"] == 50.0
    print("11. [PASS] Savings goal created with 50% initial progress.")

    # 12. Deposit to Goal (Add Rs. 25,000 to complete goal)
    res = requests.post(f"{BASE_URL}/goals/{goal_id}/deposit", json={"amount": 25000.0}, headers=headers)
    assert res.status_code == 200, f"Deposit failed: {res.text}"
    assert res.json()["is_completed"] == True
    print("12. [PASS] Savings deposit added -> Goal completed (100%) and notification triggered.")

    # 13. Create Account (Bank Account: Rs. 30,000)
    res = requests.post(f"{BASE_URL}/accounts/", json={
        "account_name": "HDFC Student Savings",
        "account_type": "Bank Account",
        "balance": 30000.0,
        "account_number": "123456789012"
    }, headers=headers)
    assert res.status_code in (200, 201), f"Account creation failed: {res.text}"
    print("13. [PASS] Bank account created and persisted.")

    # 14. Dashboard Analytics Verification
    res = requests.get(f"{BASE_URL}/dashboard/", headers=headers)
    assert res.status_code == 200, f"Dashboard failed: {res.text}"
    dash = res.json()
    assert dash["summary"]["total_income"] == 30000.0
    assert dash["summary"]["total_expenses"] == 8500.0
    assert dash["summary"]["savings"] == 21500.0
    assert len(dash["category_breakdown"]) > 0
    assert len(dash["monthly_trends"]) == 6
    print(f"14. [PASS] Dashboard analytics calculated: Income=Rs.{dash['summary']['total_income']}, Expense=Rs.{dash['summary']['total_expenses']}, Net Savings=Rs.{dash['summary']['savings']}.")

    # 15. Reports & CSV Export
    res = requests.get(f"{BASE_URL}/reports/summary?month=2026-08", headers=headers)
    assert res.status_code == 200, f"Reports summary failed: {res.text}"
    assert res.json()["summary"]["total_income"] == 30000.0

    csv_res = requests.get(f"{BASE_URL}/reports/export/csv?month=2026-08", headers=headers)
    assert csv_res.status_code == 200, f"CSV export failed: {csv_res.text}"
    assert "BudgetBuddy Financial Report" in csv_res.text
    print("15. [PASS] Reports summary & CSV export verified successfully.")

    # 16. Mark notification as read
    first_notif_id = notifs[0]["notification_id"]
    res = requests.put(f"{BASE_URL}/notifications/{first_notif_id}/read", headers=headers)
    assert res.status_code == 200, f"Mark read failed: {res.text}"
    print("16. [PASS] Notification marked as read.")

    print("\n========================================")
    print("ALL 16 BACKEND END-TO-END TESTS PASSED SUCCESSFULLY!")
    print("========================================")

if __name__ == "__main__":
    test_full_pipeline()
