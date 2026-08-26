from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.budget import Budget
from app.models.category import Category
from app.models.expense import Expense
from app.models.notification import Notification
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse


router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"]
)


def _enrich_expense(expense: Expense, db: Session) -> dict:
    cat = db.query(Category).filter(Category.category_id == expense.category_id).first()
    category_name = cat.name if cat and cat.name else f"Category {expense.category_id}"
    return {
        "expense_id": expense.expense_id,
        "user_id": expense.user_id,
        "category_id": expense.category_id,
        "category_name": category_name,
        "amount": float(expense.amount),
        "description": expense.description,
        "expense_date": expense.expense_date
    }


def _check_budget_and_notify(db: Session, user_id: int, expense_date: date, new_amount: float, category_name: str):
    exp_year = expense_date.year
    exp_month = expense_date.month

    # Find budget for this month
    budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
    matching_budget = None
    for b in budgets:
        if b.month and b.month.year == exp_year and b.month.month == exp_month:
            matching_budget = b
            break

    # Calculate total spent in this month
    total_spent = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.user_id == user_id,
        extract("year", Expense.expense_date) == exp_year,
        extract("month", Expense.expense_date) == exp_month
    ).scalar() or 0.0

    total_spent = float(total_spent)
    previous_spent = max(total_spent - new_amount, 0.0)

    if matching_budget and float(matching_budget.amount) > 0:
        budget_limit = float(matching_budget.amount)
        utilization = (total_spent / budget_limit) * 100

        # Crossing 100% threshold
        if total_spent >= budget_limit and previous_spent < budget_limit:
            notif = Notification(
                user_id=user_id,
                title="🚨 Overspending Alert!",
                message=f"You have exceeded your monthly budget of ₹{budget_limit:,.2f}! Total spent: ₹{total_spent:,.2f} ({utilization:.1f}%).",
                is_read=False
            )
            db.add(notif)
        # Crossing 80% threshold
        elif total_spent >= (0.80 * budget_limit) and previous_spent < (0.80 * budget_limit):
            notif = Notification(
                user_id=user_id,
                title="⚠️ Budget Limit Warning",
                message=f"You have reached {utilization:.1f}% of your ₹{budget_limit:,.2f} budget. ₹{max(budget_limit - total_spent, 0.0):,.2f} remaining.",
                is_read=False
            )
            db.add(notif)
        else:
            notif = Notification(
                user_id=user_id,
                title="New Expense Added",
                message=f"₹{new_amount:,.2f} spent on {category_name}.",
                is_read=False
            )
            db.add(notif)
    else:
        notif = Notification(
            user_id=user_id,
            title="New Expense Added",
            message=f"₹{new_amount:,.2f} spent on {category_name}.",
            is_read=False
        )
        db.add(notif)


# ==========================================
# CREATE EXPENSE
# ==========================================
@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if expense.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    # Fetch category
    cat = db.query(Category).filter(
        Category.category_id == expense.category_id
    ).first()
    category_name = cat.name if cat else "General"

    new_expense = Expense(
        user_id=current_user.user_id,
        category_id=expense.category_id,
        amount=expense.amount,
        description=expense.description.strip() if expense.description else None,
        expense_date=expense.expense_date
    )

    db.add(new_expense)
    db.flush()

    # Trigger budget threshold check & notification
    _check_budget_and_notify(
        db=db,
        user_id=current_user.user_id,
        expense_date=expense.expense_date,
        new_amount=expense.amount,
        category_name=category_name
    )

    db.commit()
    db.refresh(new_expense)

    return _enrich_expense(new_expense, db)


# ==========================================
# GET ALL MY EXPENSES (WITH OPTIONAL FILTER)
# ==========================================
@router.get("/", response_model=list[ExpenseResponse])
def get_expenses(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    category_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Expense).filter(
        Expense.user_id == current_user.user_id
    )

    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)
    if category_id:
        query = query.filter(Expense.category_id == category_id)

    expenses = query.order_by(Expense.expense_date.desc(), Expense.expense_id.desc()).all()

    return [_enrich_expense(e, db) for e in expenses]


# ==========================================
# GET MY EXPENSE BY ID
# ==========================================
@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(
        Expense.expense_id == expense_id,
        Expense.user_id == current_user.user_id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    return _enrich_expense(expense, db)


# ==========================================
# UPDATE MY EXPENSE
# ==========================================
@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    updated_expense: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(
        Expense.expense_id == expense_id,
        Expense.user_id == current_user.user_id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    if updated_expense.category_id is not None:
        expense.category_id = updated_expense.category_id
    if updated_expense.amount is not None:
        if updated_expense.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        expense.amount = updated_expense.amount
    if updated_expense.description is not None:
        expense.description = updated_expense.description.strip()
    if updated_expense.expense_date is not None:
        expense.expense_date = updated_expense.expense_date

    db.commit()
    db.refresh(expense)

    return _enrich_expense(expense, db)


# ==========================================
# DELETE MY EXPENSE
# ==========================================
@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(
        Expense.expense_id == expense_id,
        Expense.user_id == current_user.user_id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    db.delete(expense)
    db.commit()

    return {
        "message": "Expense deleted successfully"
    }