"""add_file_table

Revision ID: 11697a81b452
Revises: 992ca1e91852
Create Date: 2025-12-07 14:22:44.850147

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "11697a81b452"
down_revision: Union[str, None] = "992ca1e91852"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "File",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("contentType", sa.String(), nullable=False),
        sa.Column("data", postgresql.BYTEA(), nullable=False),
        sa.Column("size", sa.Integer(), nullable=False),
        sa.Column("userId", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("createdAt", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["userId"],
            ["User.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("File")
