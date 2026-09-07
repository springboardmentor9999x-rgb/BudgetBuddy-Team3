from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

# ============================
# Import Models
# ============================
from app.models.user import User
from app.models.category import Category
from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.account import Account
from app.models.notification import Notification
from app.models.financial_goal import FinancialGoal
from app.models.goal_contribution import GoalContribution
from app.models.premium_request import PremiumRequest

# ============================
# Create Database Tables
# ============================
Base.metadata.create_all(bind=engine)

# ============================
# Import Routers
# ============================
from app.routers import (
    auth,
    income,
    expenses,
    budget,
    accounts,
    notifications,
    categories,
    financial_goals,
    dashboard,
    reports,
    users,
    analytics,
    admin_analytics,
    premium,
    admin_users
)

# ============================
# FastAPI App
# ============================
app = FastAPI(
    title="BudgetBuddy API",
    description="Full-Stack Personal Budget Planning and Expense Management Platform",
    version="2.0.0"
)

# ============================
# CORS
# ============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# Root Health Check
# ============================
@app.get("/")
def home():
    return {
        "message": "Personal Budget Planning API is running",
        "application": "BudgetBuddy",
        "version": "2.0.0",
        "status": "success"
    }

# ============================
# Routers Registration
# ============================
app.include_router(auth.router)
app.include_router(income.router)
app.include_router(expenses.router)
app.include_router(budget.router)
app.include_router(accounts.router)
app.include_router(notifications.router)
app.include_router(categories.router)
app.include_router(financial_goals.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(users.router)
app.include_router(analytics.router)
app.include_router(admin_analytics.router)
app.include_router(premium.router)
app.include_router(admin_users.router)

