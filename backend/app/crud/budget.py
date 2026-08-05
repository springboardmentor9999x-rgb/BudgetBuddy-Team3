from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.schemas.budget import BudgetCreate


def create_budget(db: Session, user_id: int, budget_in: BudgetCreate):
    budget = Budget(user_id=user_id, **budget_in.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def get_budgets_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(Budget)
        .filter(Budget.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_budget(db: Session, budget_id: int, user_id: int):
    return (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,
            Budget.user_id == user_id
        )
        .first()
    )


def update_budget(
    db: Session,
    budget_id: int,
    user_id: int,
    budget_in: BudgetCreate
):
    budget = get_budget(db, budget_id, user_id)

    if not budget:
        return None

    for field, value in budget_in.model_dump().items():
        setattr(budget, field, value)

    db.commit()
    db.refresh(budget)

    return budget


def delete_budget(db: Session, budget_id: int, user_id: int):
    budget = get_budget(db, budget_id, user_id)

    if not budget:
        return None

    db.delete(budget)
    db.commit()

    return budget