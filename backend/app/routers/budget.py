from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.budget import Budget
from app.models.expense import Expense
from app.models.notification import Notification
from app.schemas.budget import BudgetCreate, BudgetResponse
from app.models.user import User
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/budget",
    tags=["Budget"]
)


# ==========================================
# CREATE OR UPDATE MONTHLY BUDGET
# ==========================================
@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if budget.amount <= 0:
        raise HTTPException(status_code=400, detail="Budget amount must be greater than 0")

    # Check if budget for same year and month exists
    target_year = budget.month.year
    target_month = budget.month.month

    existing_budget = None
    user_budgets = db.query(Budget).filter(Budget.user_id == current_user.user_id).all()
    for b in user_budgets:
        if b.month and b.month.year == target_year and b.month.month == target_month:
            existing_budget = b
            break

    if existing_budget:
        existing_budget.amount = budget.amount
        existing_budget.month = budget.month
        target_obj = existing_budget
        notification_title = "📊 Budget Updated"
        notification_msg = f"Monthly budget for {budget.month.strftime('%B %Y')} updated to ₹{budget.amount:,.2f}."
    else:
        new_budget = Budget(
            user_id=current_user.user_id,
            amount=budget.amount,
            month=budget.month
        )
        db.add(new_budget)
        target_obj = new_budget
        notification_title = "📊 New Budget Created"
        notification_msg = f"Monthly budget for {budget.month.strftime('%B %Y')} set to ₹{budget.amount:,.2f}."

    # Create notification
    notification = Notification(
        user_id=current_user.user_id,
        title=notification_title,
        message=notification_msg,
        is_read=False
    )
    db.add(notification)

    db.commit()
    db.refresh(target_obj)

    return target_obj


# ==========================================
# GET ALL MY BUDGETS
# ==========================================
@router.get("/", response_model=list[BudgetResponse])
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Budget).filter(
        Budget.user_id == current_user.user_id
    ).order_by(Budget.month.desc()).all()


# ==========================================
# GET BUDGET UTILIZATION STATUS
# ==========================================
@router.get("/status")
def get_budget_status(
    month_date: date | None = Query(None, alias="month"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target = month_date or date.today()
    t_year = target.year
    t_month = target.month

    # Get budget for this month
    budgets = db.query(Budget).filter(Budget.user_id == current_user.user_id).all()
    matching_budget = None
    for b in budgets:
        if b.month and b.month.year == t_year and b.month.month == t_month:
            matching_budget = b
            break

    budget_amt = float(matching_budget.amount) if matching_budget else 0.0

    # Get total spent in this month
    spent = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.user_id == current_user.user_id,
        extract("year", Expense.expense_date) == t_year,
        extract("month", Expense.expense_date) == t_month
    ).scalar() or 0.0

    spent_amt = float(spent)
    remaining = max(budget_amt - spent_amt, 0.0) if budget_amt > 0 else 0.0
    utilization = (spent_amt / budget_amt * 100) if budget_amt > 0 else 0.0

    return {
        "month": target.strftime("%Y-%m"),
        "month_label": target.strftime("%B %Y"),
        "budget_amount": budget_amt,
        "spent_amount": spent_amt,
        "remaining_amount": budget_amt - spent_amt,
        "utilization_percentage": round(utilization, 1),
        "is_overspent": spent_amt > budget_amt if budget_amt > 0 else False,
        "is_warning": utilization >= 80.0 and spent_amt <= budget_amt if budget_amt > 0 else False
    }


# ==========================================
# DELETE BUDGET
# ==========================================
@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(
        Budget.budget_id == budget_id,
        Budget.user_id == current_user.user_id
    ).first()

    if not budget:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    db.delete(budget)
    db.commit()

    return {
        "message": "Budget deleted successfully"
    }