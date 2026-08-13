from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.models.income import Income
from app.schemas.expense import ExpenseCreate, ExpenseOut

from app.crud.expense import (
    create_expense,
    get_expenses_by_user,
    get_expense,
    update_expense,
    delete_expense,
)

from app.core.deps import get_current_user


router = APIRouter()


# ==========================================================
# CREATE EXPENSE
# ==========================================================

@router.post("/", response_model=ExpenseOut)
def add_expense(
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = create_expense(
        db,
        current_user.id,
        expense_in
    )

    if not expense:
        raise HTTPException(
            status_code=400,
            detail="Invalid bank account or bank account does not belong to the user"
        )

    return expense


# ==========================================================
# LIST EXPENSES
# ==========================================================

@router.get("/", response_model=list[ExpenseOut])
def list_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_expenses_by_user(
        db,
        current_user.id,
        skip,
        limit,
    )


# ==========================================================
# EXPENSE SUMMARY
# ==========================================================

@router.get("/summary")
def expense_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = (
        db.query(
            Expense.category,
            func.sum(Expense.amount).label("total"),
        )
        .filter(
            Expense.user_id == current_user.id
        )
        .group_by(
            Expense.category
        )
        .order_by(
            func.sum(Expense.amount).desc()
        )
        .all()
    )

    return [
        {
            "category": category,
            "total": float(total),
        }
        for category, total in results
    ]


# ==========================================================
# DASHBOARD
# ==========================================================

@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    total_income = (
        db.query(
            func.coalesce(
                func.sum(Income.amount),
                0
            )
        )
        .filter(
            Income.user_id == current_user.id
        )
        .scalar()
    )

    total_expenses = (
        db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0
            )
        )
        .filter(
            Expense.user_id == current_user.id
        )
        .scalar()
    )

    total_income = float(total_income or 0)
    total_expenses = float(total_expenses or 0)

    balance = total_income - total_expenses

    top_categories = (
        db.query(
            Expense.category,
            func.sum(Expense.amount).label("total"),
        )
        .filter(
            Expense.user_id == current_user.id
        )
        .group_by(
            Expense.category
        )
        .order_by(
            func.sum(Expense.amount).desc()
        )
        .limit(3)
        .all()
    )

    top_3_categories = [
        {
            "category": category,
            "total": float(total),
        }
        for category, total in top_categories
    ]

    recent_expenses = (
        db.query(Expense)
        .filter(
            Expense.user_id == current_user.id
        )
        .order_by(
            Expense.date.desc()
        )
        .limit(5)
        .all()
    )

    recent_incomes = (
        db.query(Income)
        .filter(
            Income.user_id == current_user.id
        )
        .order_by(
            Income.date.desc()
        )
        .limit(5)
        .all()
    )

    transactions = []

    for expense in recent_expenses:
        transactions.append({
            "id": expense.id,
            "type": "expense",
            "category": expense.category,
            "description": expense.description,
            "amount": float(expense.amount),
            "date": expense.date,
        })

    for income in recent_incomes:
        transactions.append({
            "id": income.id,
            "type": "income",
            "source": income.source,
            "notes": income.notes,
            "amount": float(income.amount),
            "date": income.date,
        })

    transactions.sort(
        key=lambda x: x["date"],
        reverse=True
    )

    recent_transactions = transactions[:5]

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": balance,
        "top_3_categories": top_3_categories,
        "recent_transactions": recent_transactions,
    }


# ==========================================================
# GET SINGLE EXPENSE
# ==========================================================

@router.get("/{expense_id}", response_model=ExpenseOut)
def get_single_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = get_expense(
        db,
        expense_id,
        current_user.id,
    )

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found",
        )

    return expense


# ==========================================================
# UPDATE EXPENSE
# ==========================================================

@router.put("/{expense_id}", response_model=ExpenseOut)
def edit_expense(
    expense_id: int,
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = update_expense(
        db,
        expense_id,
        current_user.id,
        expense_in,
    )

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found or invalid bank account",
        )

    return expense


# ==========================================================
# DELETE EXPENSE
# ==========================================================

@router.delete("/{expense_id}")
def remove_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = delete_expense(
        db,
        expense_id,
        current_user.id,
    )

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    return {
        "message": "Expense deleted successfully"
    }