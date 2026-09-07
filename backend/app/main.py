# backend/app/main.py

from dotenv import load_dotenv

load_dotenv()


from fastapi import (
    FastAPI,
    Depends,
)

from fastapi.middleware.cors import CORSMiddleware


from app.routers import (
    auth,
    expense,
    income,
    budget,
    dashboard,
    savings_goal,
    notification,
    bank_account,
    analytics,
    reports,
    admin,  # NEW
)


from app.database import engine

from app.core.deps import (
    get_current_user,
)

from app.models.user import User


# ==========================================================
# FASTAPI APPLICATION
# ==========================================================

app = FastAPI(
    title="BudgetBuddy API"
)


# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],

    allow_credentials=True,

    allow_methods=[
        "*"
    ],

    allow_headers=[
        "*"
    ],
)


# ==========================================================
# AUTHENTICATION
# ==========================================================

app.include_router(
    auth.router,
    prefix="/auth",
    tags=[
        "Authentication"
    ],
)


# ==========================================================
# EXPENSES
# ==========================================================

app.include_router(
    expense.router,
    prefix="/expenses",
    tags=[
        "Expenses"
    ],
)


# ==========================================================
# INCOMES
# ==========================================================

app.include_router(
    income.router,
    prefix="/incomes",
    tags=[
        "Incomes"
    ],
)


# ==========================================================
# BUDGETS
# ==========================================================

app.include_router(
    budget.router,
    prefix="/budgets",
    tags=[
        "Budgets"
    ],
)


# ==========================================================
# DASHBOARD
# ==========================================================

app.include_router(
    dashboard.router,
    prefix="",
    tags=[
        "Dashboard"
    ],
)


# ==========================================================
# BANK ACCOUNTS
# ==========================================================

app.include_router(
    bank_account.router,
    prefix="/bank-accounts",
    tags=[
        "Bank Accounts"
    ],
)


# ==========================================================
# SAVINGS GOALS
# ==========================================================

app.include_router(
    savings_goal.router,
    prefix="",
    tags=[
        "Savings Goals"
    ],
)


# ==========================================================
# NOTIFICATIONS
# ==========================================================

app.include_router(
    notification.router,
    prefix="",
    tags=[
        "Notifications"
    ],
)


# ==========================================================
# ANALYTICS
# ==========================================================

app.include_router(
    analytics.router,
    prefix="",
    tags=[
        "Analytics"
    ],
)


# ==========================================================
# REPORTS
# ==========================================================

app.include_router(
    reports.router,
    prefix="",
    tags=[
        "Reports"
    ],
)


# ==========================================================
# ADMIN
# ==========================================================

app.include_router(
    admin.router,
    prefix="",
    tags=[
        "Admin"
    ],
)


# ==========================================================
# ROOT
# ==========================================================

@app.get("/")
def root():

    return {
        "message":
            "BudgetBuddy API running"
    }


# ==========================================================
# DATABASE TEST
# ==========================================================

@app.get("/db-test")
def db_test():

    try:

        with engine.connect():

            return {
                "message":
                    "Database Connected Successfully"
            }

    except Exception as e:

        return {
            "error":
                str(e)
        }


# ==========================================================
# CURRENT USER
# ==========================================================

@app.get("/me")
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
):

    return {
        "id":
            current_user.id,

        "email":
            current_user.email,

        "role":
            current_user.role,
    }