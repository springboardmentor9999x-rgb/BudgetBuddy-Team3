import sys
from pathlib import Path

# Make sure Python can import the "app" package
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.database import SessionLocal
from app.models.user import User


ADMIN_EMAIL = "budgetbuddy1384@gmail.com"


def create_admin():
    db = SessionLocal()

    try:
        user = (
            db.query(User)
            .filter(User.email == ADMIN_EMAIL)
            .first()
        )

        if not user:
            print(f"User not found: {ADMIN_EMAIL}")
            print(
                "Please create the account through the normal "
                "BudgetBuddy signup page first."
            )
            return

        if user.role == "admin":
            print(f"{ADMIN_EMAIL} is already an Admin.")
            return

        # Promote this existing account to Admin.
        user.role = "admin"

        db.commit()
        db.refresh(user)

        print("=" * 50)
        print("Admin account created successfully!")
        print("=" * 50)
        print(f"Email : {user.email}")
        print(f"Name  : {user.full_name}")
        print(f"Role  : {user.role}")
        print(f"ID    : {user.id}")
        print("=" * 50)
        print("You can now log out and log in again.")

    except Exception as e:
        db.rollback()
        print("Failed to create Admin account.")
        print(f"Error: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()