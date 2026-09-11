"""add bank account to savings goals

Revision ID: d102e46612c2
Revises: 0e64475dd169
Create Date: 2026-08-19 17:00:46.903535

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d102e46612c2"

down_revision: Union[str, Sequence[str], None] = "0e64475dd169"

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # ==========================================================
    # ADD BANK ACCOUNT TO SAVINGS GOALS
    # ==========================================================

    op.add_column(
        "savings_goals",
        sa.Column(
            "bank_account_id",
            sa.Integer(),
            nullable=True
        )
    )

    # ==========================================================
    # CREATE FOREIGN KEY
    # ==========================================================

    op.create_foreign_key(
        "fk_savings_goals_bank_account_id",
        "savings_goals",
        "bank_accounts",
        ["bank_account_id"],
        ["id"]
    )

    # ==========================================================
    # PREVENT DUPLICATE SAVINGS GOALS
    # ==========================================================

    op.create_unique_constraint(
        "uq_user_savings_goal_title",
        "savings_goals",
        ["user_id", "title"]
    )


def downgrade() -> None:
    """Downgrade schema."""

    # Remove duplicate-prevention constraint
    op.drop_constraint(
        "uq_user_savings_goal_title",
        "savings_goals",
        type_="unique"
    )

    # Remove foreign key
    op.drop_constraint(
        "fk_savings_goals_bank_account_id",
        "savings_goals",
        type_="foreignkey"
    )

    # Remove bank account column
    op.drop_column(
        "savings_goals",
        "bank_account_id"
    )