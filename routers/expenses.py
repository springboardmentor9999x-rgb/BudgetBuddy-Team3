from fastapi import APIRouter

router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"]
)


@router.get("/")
def get_expenses():
    return {
        "message": "Expenses API is working"
    }


@router.post("/")
def add_expense():
    return {
        "message": "Expense added successfully"
    }