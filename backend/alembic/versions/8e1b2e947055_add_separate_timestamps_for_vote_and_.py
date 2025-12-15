"""add_separate_timestamps_for_vote_and_feedback

Revision ID: 8e1b2e947055
Revises: 56729fee6c5c
Create Date: 2025-12-15 01:25:20.989735

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8e1b2e947055"
down_revision: Union[str, None] = "56729fee6c5c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add separate timestamp columns for vote and feedback tracking
    # These allow tracking when votes and feedback are created/updated independently
    op.add_column("Vote_v2", sa.Column("voteCreatedAt", sa.DateTime(), nullable=True))
    op.add_column("Vote_v2", sa.Column("voteUpdatedAt", sa.DateTime(), nullable=True))
    op.add_column("Vote_v2", sa.Column("feedbackCreatedAt", sa.DateTime(), nullable=True))
    op.add_column("Vote_v2", sa.Column("feedbackUpdatedAt", sa.DateTime(), nullable=True))

    # For existing rows, infer timestamps from createdAt/updatedAt and existing data
    # If isUpvoted is set, assume vote was created at createdAt
    op.execute(
        """
        UPDATE "Vote_v2"
        SET "voteCreatedAt" = "createdAt", "voteUpdatedAt" = "updatedAt"
        WHERE "isUpvoted" IS NOT NULL
        """
    )

    # If feedback exists, assume feedback was created at createdAt
    op.execute(
        """
        UPDATE "Vote_v2"
        SET "feedbackCreatedAt" = "createdAt", "feedbackUpdatedAt" = "updatedAt"
        WHERE "feedback" IS NOT NULL
        """
    )


def downgrade() -> None:
    # Remove separate timestamp columns
    op.drop_column("Vote_v2", "feedbackUpdatedAt")
    op.drop_column("Vote_v2", "feedbackCreatedAt")
    op.drop_column("Vote_v2", "voteUpdatedAt")
    op.drop_column("Vote_v2", "voteCreatedAt")
