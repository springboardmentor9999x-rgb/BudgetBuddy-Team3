import logging
import os
import time

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "")
# Render and other PaaS providers often supply postgres:// instead of postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(target_engine=None):
    """
    Safely initializes tables and applies non-destructive migrations at startup.
    - Creates any missing tables from SQLAlchemy models
    - Performs safe column migrations (e.g. users.role, notifications.action_url)
    - Ensures performance indexes exist
    - Fully idempotent across PostgreSQL (Render) and SQLite (testing)
    """
    if target_engine is None:
        target_engine = engine

    # Retry connection in case database is still starting up
    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            with target_engine.connect() as conn:
                pass
            break
        except Exception as e:
            if attempt < max_retries:
                logger.warning(
                    f"Database connection attempt {attempt}/{max_retries} failed: {e}. Retrying in 2s..."
                )
                time.sleep(2)
            else:
                logger.error(f"Database connection failed after {max_retries} attempts.")
                raise

    # 1. Create all missing tables from SQLAlchemy models
    Base.metadata.create_all(bind=target_engine)

    # 2. Run column & index migrations
    with target_engine.connect() as conn:
        inspector = inspect(conn)

        # Ensure users.role exists with correct default 'USER'
        if inspector.has_table("users"):
            user_cols = {col["name"] for col in inspector.get_columns("users")}
            if "role" not in user_cols:
                logger.info("Migrating: Adding missing 'role' column to 'users' table...")
                conn.execute(
                    text("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER'")
                )
                conn.commit()
            else:
                # Ensure no existing rows have NULL role
                conn.execute(text("UPDATE users SET role = 'USER' WHERE role IS NULL"))
                conn.commit()

        # Ensure notifications.action_url exists
        if inspector.has_table("notifications"):
            notif_cols = {col["name"] for col in inspector.get_columns("notifications")}
            if "action_url" not in notif_cols:
                logger.info("Migrating: Adding missing 'action_url' column to 'notifications' table...")
                conn.execute(
                    text("ALTER TABLE notifications ADD COLUMN action_url VARCHAR(255)")
                )
                conn.commit()

        # Ensure performance indexes exist
        indexes = [
            ("idx_expenses_user_date", "expenses", "(user_id, expense_date)"),
            ("idx_income_user_date", "income", "(user_id, income_date)"),
            ("idx_budgets_user_month", "budgets", "(user_id, month)"),
            ("idx_notifications_user", "notifications", "(user_id, is_read)"),
            ("idx_goals_user", "financial_goals", "(user_id)"),
            ("idx_premium_requests_user", "premium_requests", "(user_id, status)"),
            ("idx_goal_contributions_goal", "goal_contributions", "(goal_id, contributed_at)"),
            ("idx_goal_contributions_user", "goal_contributions", "(user_id, contributed_at)"),
        ]

        for idx_name, table_name, cols in indexes:
            if inspector.has_table(table_name):
                try:
                    conn.execute(
                        text(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table_name}{cols}")
                    )
                except Exception as e:
                    logger.warning(f"Index creation skipped for {idx_name}: {e}")
        conn.commit()

        