from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.income import Income
from app.models.notification import Notification
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.income import IncomeCreate, IncomeResponse


router = APIRouter(
    prefix="/income",
    tags=["Income"]
)


def _format_income(income: Income) -> dict:
    return {
        "income_id": income.income_id,
        "user_id": income.user_id,
        "amount": float(income.amount),
        "source": income.source,
        "description": income.description,
        "income_date": income.income_date,
        "bank_name": income.bank_name
    }


# ==========================================
# CREATE INCOME
# ==========================================
@router.post("/", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income(
    income: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if income.amount <= 0:
        raise HTTPException(status_code=400, detail="Income amount must be greater than 0")

    new_income = Income(
        user_id=current_user.user_id,
        amount=income.amount,
        source=income.source.strip(),
        description=income.description.strip() if income.description else None,
        income_date=income.income_date,
        bank_name=income.bank_name.strip() if income.bank_name else None
    )

    db.add(new_income)

    # Create notification
    notification = Notification(
        user_id=current_user.user_id,
        title="💵 New Income Added",
        message=f"₹{income.amount:,.2f} received from {income.source}.",
        is_read=False
    )
    db.add(notification)

    db.commit()
    db.refresh(new_income)

    return _format_income(new_income)


# ==========================================
# GET ALL MY INCOMES
# ==========================================
@router.get("/", response_model=list[IncomeResponse])
def get_incomes(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Income).filter(
        Income.user_id == current_user.user_id
    )

    if start_date:
        query = query.filter(Income.income_date >= start_date)
    if end_date:
        query = query.filter(Income.income_date <= end_date)

    incomes = query.order_by(Income.income_date.desc(), Income.income_id.desc()).all()

    return [_format_income(i) for i in incomes]


# ==========================================
# GET INCOME BY ID
# ==========================================
@router.get("/{income_id}", response_model=IncomeResponse)
def get_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    income = db.query(Income).filter(
        Income.income_id == income_id,
        Income.user_id == current_user.user_id
    ).first()

    if not income:
        raise HTTPException(
            status_code=404,
            detail="Income not found"
        )

    return _format_income(income)


# ==========================================
# UPDATE INCOME
# ==========================================
@router.put("/{income_id}", response_model=IncomeResponse)
def update_income(
    income_id: int,
    updated_income: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    income = db.query(Income).filter(
        Income.income_id == income_id,
        Income.user_id == current_user.user_id
    ).first()

    if not income:
        raise HTTPException(
            status_code=404,
            detail="Income not found"
        )

    if updated_income.amount <= 0:
        raise HTTPException(status_code=400, detail="Income amount must be greater than 0")

    income.amount = updated_income.amount
    income.source = updated_income.source.strip()
    income.description = updated_income.description.strip() if updated_income.description else None
    income.income_date = updated_income.income_date
    income.bank_name = updated_income.bank_name.strip() if updated_income.bank_name else None

    db.commit()
    db.refresh(income)

    return _format_income(income)


# ==========================================
# DELETE INCOME
# ==========================================
@router.delete("/{income_id}")
def delete_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    income = db.query(Income).filter(
        Income.income_id == income_id,
        Income.user_id == current_user.user_id
    ).first()

    if not income:
        raise HTTPException(
            status_code=404,
            detail="Income not found"
        )

    db.delete(income)
    db.commit()

    return {
        "message": "Income deleted successfully"
    }