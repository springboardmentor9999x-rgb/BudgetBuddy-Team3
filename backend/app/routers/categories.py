from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryResponse
from app.models.user import User
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)

DEFAULT_CATEGORIES = [
    "Food",
    "Travel",
    "Shopping",
    "Education",
    "Entertainment",
    "Bills & Utilities",
    "Healthcare",
    "Miscellaneous"
]


def ensure_default_categories(db: Session, user_id: int):
    existing = db.query(Category).filter(Category.user_id == user_id).first()
    if not existing:
        for cat_name in DEFAULT_CATEGORIES:
            db.add(Category(user_id=user_id, name=cat_name))
        db.commit()


# ==========================================
# GET ALL MY CATEGORIES (WITH AUTO SEED)
# ==========================================
@router.get("/", response_model=list[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_default_categories(db, current_user.user_id)
    categories = db.query(Category).filter(
        Category.user_id == current_user.user_id
    ).order_by(Category.category_id.asc()).all()

    return categories


# ==========================================
# CREATE CATEGORY
# ==========================================
@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    clean_name = category.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Category name cannot be empty")

    existing = db.query(Category).filter(
        Category.user_id == current_user.user_id,
        Category.name.ilike(clean_name)
    ).first()

    if existing:
        return existing

    new_category = Category(
        user_id=current_user.user_id,
        name=clean_name
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category


# ==========================================
# GET CATEGORY BY ID
# ==========================================
@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = db.query(Category).filter(
        Category.category_id == category_id,
        Category.user_id == current_user.user_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return category


# ==========================================
# UPDATE CATEGORY
# ==========================================
@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    updated_category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = db.query(Category).filter(
        Category.category_id == category_id,
        Category.user_id == current_user.user_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    category.name = updated_category.name.strip()
    db.commit()
    db.refresh(category)

    return category


# ==========================================
# DELETE CATEGORY
# ==========================================
@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = db.query(Category).filter(
        Category.category_id == category_id,
        Category.user_id == current_user.user_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    db.delete(category)
    db.commit()

    return {
        "message": "Category deleted successfully"
    }