"""
DEPRECATED — DO NOT RUN THIS FILE DIRECTLY.
============================================
This script has been replaced by the proper pytest-based test suite:

    tests/test_security.py

The original script hit the LIVE server at http://127.0.0.1:8000, which
caused test-generated users (Alice, Bob) to be created in the production
PostgreSQL database (personal_budget_db).

The new suite uses FastAPI TestClient with an isolated SQLite test database
and NEVER contacts the live database.

To run the full test suite safely:
    cd backend
    python -m pytest tests/ -v

DO NOT run this file with `python test_security.py`.
"""

raise SystemExit(
    "\n\nERROR: This script is deprecated and must not be run directly.\n"
    "Running it would create test users in the LIVE PostgreSQL database.\n\n"
    "Run the safe pytest suite instead:\n"
    "    cd backend\n"
    "    python -m pytest tests/ -v\n"
)
