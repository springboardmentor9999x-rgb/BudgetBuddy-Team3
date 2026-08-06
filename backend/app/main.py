from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, expense, income, budget, dashboard
from app.database import engine
from app.core.deps import get_current_user
from app.models.user import User


app = FastAPI(title="BudgetBuddy API")


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Authentication routes
app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)


# Expense CRUD routes
app.include_router(
    expense.router,
    prefix="/expenses",
    tags=["Expenses"]
)


# Income CRUD routes
app.include_router(
    income.router,
    prefix="/incomes",
    tags=["Incomes"]
)


# Budget CRUD routes
app.include_router(
    budget.router,
    prefix="/budgets",
    tags=["Budgets"]
)

app.include_router(
    dashboard.router,
    prefix="",
    tags=["Dashboard"]
)

@app.get("/")
def root():
    return {
        "message": "BudgetBuddy API running"
    }


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


@app.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    }