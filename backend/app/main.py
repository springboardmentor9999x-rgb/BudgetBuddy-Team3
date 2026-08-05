from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth
from app.database import engine
from app.core.deps import get_current_user
from app.models.user import User

app = FastAPI(title="BudgetBuddy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

@app.get("/")
def root():
    return {"message": "BudgetBuddy API running"}

@app.get("/db-test")
def db_test():
    try:
        with engine.connect():
            return {"message": "Database Connected Successfully"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    }