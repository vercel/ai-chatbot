"""add_timestamps_to_vote_v2

Revision ID: 56729fee6c5c
Revises: 0165c8109465
Create Date: 2025-12-15 01:19:07.870789

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "56729fee6c5c"
down_revision: Union[str, None] = "4af0ed37be0c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add createdAt and updatedAt columns to Vote_v2 table
    # For existing rows, set both to current timestamp
    op.add_column("Vote_v2", sa.Column("createdAt", sa.DateTime(), nullable=True))
    op.add_column("Vote_v2", sa.Column("updatedAt", sa.DateTime(), nullable=True))

    # Set default values for existing rows
    op.execute(
        'UPDATE "Vote_v2" SET "createdAt" = NOW(), "updatedAt" = NOW() WHERE "createdAt" IS NULL'
    )

    # Make columns non-nullable after setting defaults
    op.alter_column("Vote_v2", "createdAt", nullable=False, server_default=sa.func.now())
    op.alter_column("Vote_v2", "updatedAt", nullable=False, server_default=sa.func.now())


def downgrade() -> None:
    # Remove timestamp columns
    op.drop_column("Vote_v2", "updatedAt")
    op.drop_column("Vote_v2", "createdAt")
