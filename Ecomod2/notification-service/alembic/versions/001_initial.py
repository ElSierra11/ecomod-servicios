"""Initial notification schema

Revision ID: 001
Revises: 
Create Date: 2026-05-11
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=True, index=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("type", sa.String(), nullable=False, index=True),
        sa.Column("channel", sa.String(), nullable=False, server_default="email"),
        sa.Column("subject", sa.String(), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("reference_id", sa.Integer(), nullable=True),
        sa.Column("reference_type", sa.String(), nullable=True),
        sa.Column("sent", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )


def downgrade():
    op.drop_table("notifications")
