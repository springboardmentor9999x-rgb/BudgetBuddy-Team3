"""
BudgetBuddy — Safe Database Migration Script
Run once to add:
  1. role column to users table (defaults to 'USER')
  2. goal_contributions table for premium savings trend charts

Usage:
    cd backend
    python migrate_role.py
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Parse the SQLAlchemy-style URL to psycopg2-compatible kwargs
def parse_db_url(url: str) -> dict:
    # postgresql://user:password@host:port/dbname
    url = url.replace("postgresql://", "").replace("postgres://", "")
    userinfo, rest = url.split("@", 1)
    user, password = userinfo.split(":", 1)
    hostport, dbname = rest.split("/", 1)
    if ":" in hostport:
        host, port = hostport.split(":", 1)
    else:
        host, port = hostport, "5432"
    return {
        "host": host,
        "port": int(port),
        "dbname": dbname,
        "user": user,
        "password": password
    }


MIGRATIONS = [
    # 1. Add role column to users table (safe: IF NOT EXISTS)
    """
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'USER';
    """,

    # 2. Create goal_contributions table for premium savings trend tracking
    """
    CREATE TABLE IF NOT EXISTS goal_contributions (
        contribution_id SERIAL PRIMARY KEY,
        goal_id INTEGER NOT NULL REFERENCES financial_goals(goal_id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        amount NUMERIC(12, 2) NOT NULL,
        contributed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,

    # 3. Index for fast lookup by goal
    """
    CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal
    ON goal_contributions(goal_id, contributed_at);
    """,

    # 4. Index for fast lookup by user
    """
    CREATE INDEX IF NOT EXISTS idx_goal_contributions_user
    ON goal_contributions(user_id, contributed_at);
    """,
]


def run_migrations():
    print("=" * 60)
    print("BudgetBuddy Database Migration")
    print("=" * 60)

    params = parse_db_url(DATABASE_URL)
    conn = psycopg2.connect(**params)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        for i, sql in enumerate(MIGRATIONS, 1):
            label = sql.strip().split("\n")[0].strip()
            print(f"\n[{i}/{len(MIGRATIONS)}] Running: {label[:80]}...")
            cur.execute(sql)
            print(f"  [OK] Done")

        conn.commit()
        print("\n" + "=" * 60)
        print("[SUCCESS] All migrations completed successfully!")
        print("=" * 60)
        print("\nNext steps:")
        print("  1. Restart the FastAPI server (uvicorn app.main:app --reload)")
        print("  2. To promote a user to ADMIN:")
        print("     UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';")
        print("  3. Users must log out and back in to receive a role-bearing JWT token.")

    except Exception as e:
        conn.rollback()
        print(f"\n[FAILED] Migration failed: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    run_migrations()
