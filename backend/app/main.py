from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth,
    expense,
    income,
    budget,
    dashboard,
    savings_goal,
    notification,
    bank_account
)

from app.database import engine
from app.core.deps import get_current_user
from app.models.user import User


app = FastAPI(title="BudgetBuddy API")


# ==========================================================
# CORS CONFIGURATION
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# AUTHENTICATION ROUTES
# ==========================================================

app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)


# ==========================================================
# EXPENSE CRUD ROUTES
# ==========================================================

app.include_router(
    expense.router,
    prefix="/expenses",
    tags=["Expenses"]
)


# ==========================================================
# INCOME CRUD ROUTES
# ==========================================================

app.include_router(
    income.router,
    prefix="/incomes",
    tags=["Incomes"]
)


# ==========================================================
# BUDGET CRUD ROUTES
# ==========================================================

app.include_router(
    budget.router,
    prefix="/budgets",
    tags=["Budgets"]
)


# ==========================================================
# DASHBOARD ROUTES
# ==========================================================

app.include_router(
    dashboard.router,
    prefix="",
    tags=["Dashboard"]
)


# ==========================================================
# BANK ACCOUNT CRUD ROUTES
# ==========================================================

app.include_router(
    bank_account.router,
    prefix="/bank-accounts",
    tags=["Bank Accounts"]
)


# ==========================================================
# SAVINGS GOAL CRUD ROUTES
# ==========================================================

app.include_router(
    savings_goal.router,
    prefix="",
    tags=["Savings Goals"]
)


# ==========================================================
# NOTIFICATION ROUTES
# ==========================================================

app.include_router(
    notification.router,
    prefix="",
    tags=["Notifications"]
)


# ==========================================================
# ROOT
# ==========================================================

@app.get("/")
def root():
    return {
        "message": "BudgetBuddy API running"
    }


# ==========================================================
# DATABASE TEST
# ==========================================================

@app.get("/db-test")
def db_test():
    try:
        with engine.connect():
            return {
                "message": "Database Connected Successfully"
            }

    except Exception as e:
        return {
            "error": str(e)
        }


# ==========================================================
# CURRENT USER
# ==========================================================

@app.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    }