from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.savings_goal import (
    SavingsGoalCreate,
    SavingsGoalContribute,
    SavingsGoalOut,
)
from app.crud import savings_goal as savings_goal_crud


router = APIRouter(
    prefix="/goals",
    tags=["Savings Goals"]
)


# CREATE
@router.post(
    "/",
    response_model=SavingsGoalOut,
    status_code=status.HTTP_201_CREATED
)
def create_goal(
    goal_in: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return savings_goal_crud.create_savings_goal(
        db,
        current_user.id,
        goal_in
    )


# GET ALL
@router.get(
    "/",
    response_model=list[SavingsGoalOut]
)
def get_goals(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return savings_goal_crud.get_savings_goals_by_user(
        db,
        current_user.id,
        skip,
        limit
    )


# CONTRIBUTE
@router.patch(
    "/{goal_id}/contribute",
    response_model=SavingsGoalOut
)
def contribute(
    goal_id: int,
    contribution: SavingsGoalContribute,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = savings_goal_crud.contribute_to_savings_goal(
        db,
        goal_id,
        current_user.id,
        contribution.amount
    )

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )

    return goal


# GET ONE
@router.get(
    "/{goal_id}",
    response_model=SavingsGoalOut
)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = savings_goal_crud.get_savings_goal(
        db,
        goal_id,
        current_user.id
    )

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )

    return goal


# UPDATE
@router.put(
    "/{goal_id}",
    response_model=SavingsGoalOut
)
def update_goal(
    goal_id: int,
    goal_in: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = savings_goal_crud.update_savings_goal(
        db,
        goal_id,
        current_user.id,
        goal_in
    )

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )

    return goal


# DELETE
@router.delete(
    "/{goal_id}",
    response_model=SavingsGoalOut
)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = savings_goal_crud.delete_savings_goal(
        db,
        goal_id,
        current_user.id
    )

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )

    return goal