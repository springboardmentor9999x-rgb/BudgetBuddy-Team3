"""add premium trial fields to users

Revision ID: f1a2b3c4d5e6
Revises: d102e46612c2
Create Date: 2026-09-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'd102e46612c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        'users',
        sa.Column(
            'trial_used',
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column(
        'users',
        sa.Column(
            'premium_expires_at',
            sa.DateTime(),
            nullable=True,
        ),
    )

    # Drop the server default now that existing rows are backfilled;
    # new rows will rely on the model-level default instead.
    op.alter_column('users', 'trial_used', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column('users', 'premium_expires_at')
    op.drop_column('users', 'trial_used')