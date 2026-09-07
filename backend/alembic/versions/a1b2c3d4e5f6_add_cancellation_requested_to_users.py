"""add cancellation_requested to users

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-09-01 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        'users',
        sa.Column(
            'cancellation_requested',
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    # Drop the server default now that existing rows are backfilled;
    # new rows will rely on the model-level default instead.
    op.alter_column('users', 'cancellation_requested', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column('users', 'cancellation_requested')
