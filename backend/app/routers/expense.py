from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
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


@router.post("/", response_model=ExpenseOut)
def add_expense(
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_expense(db, current_user.id, expense_in)


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
            detail="Expense not found",
        )

    return expense


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
            detail="Expense not found",
        )

    return {
        "message": "Expense deleted successfully"
    }
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
        .filter(Expense.user_id == current_user.id)
        .group_by(Expense.category)
        .all()
    )

    return [
        {
            "category": category,
            "total": float(total),
        }
        for category, total in results
    ]


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