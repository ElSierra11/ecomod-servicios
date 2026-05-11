"""Initial auth schema

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
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("username", sa.String(), nullable=True, unique=True, index=True),
        sa.Column("password", sa.String(), nullable=False),
        sa.Column("role", sa.String(), server_default="cliente"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("nombre", sa.String(), nullable=True),
        sa.Column("apellido", sa.String(), nullable=True),
        sa.Column("telefono", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("last_login", sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table("users")
