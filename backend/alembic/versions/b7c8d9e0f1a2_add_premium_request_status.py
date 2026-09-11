"""add Premium request tracking to notifications

Revision ID: b7c8d9e0f1a2
Revises: a1b2c3d4e5f6
Create Date: 2026-09-03 18:19:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import re


revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "notifications",
        sa.Column(
            "requester_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "notifications",
        sa.Column(
            "request_status",
            sa.String(),
            nullable=True,
        ),
    )

    # Preserve existing unread Premium request notifications.
    # Older rows did not have structured request fields, so recover
    # the requester ID from the existing message format.
    #
    # Read requests are intentionally left without a status because
    # their old state cannot reliably distinguish approved from rejected.
    connection = op.get_bind()

    rows = connection.execute(
        sa.text(
            "SELECT id, message FROM notifications "
            "WHERE type = 'premium_request' AND is_read = false"
        )
    ).fetchall()

    for row in rows:
        match = re.search(
            r"User ID:\s*(\d+)",
            row.message or ""
        )

        if not match:
            continue

        connection.execute(
            sa.text(
                "UPDATE notifications "
                "SET requester_id = :requester_id, "
                "request_status = 'pending' "
                "WHERE id = :notification_id"
            ),
            {
                "requester_id": int(match.group(1)),
                "notification_id": row.id,
            },
        )

    op.create_index(
        "ix_notifications_requester_status",
        "notifications",
        ["requester_id", "request_status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_notifications_requester_status",
        table_name="notifications",
    )

    op.drop_column(
        "notifications",
        "request_status",
    )

    op.drop_column(
        "notifications",
        "requester_id",
    )