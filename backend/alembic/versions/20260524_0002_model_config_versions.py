"""Add model config versions

Revision ID: 20260524_0002
Revises: 20260524_0001
Create Date: 2026-05-24 00:20:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260524_0002"
down_revision = "20260524_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "model_config_versions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("change_note", sa.Text(), nullable=True),
        sa.Column("alpha_scale", sa.JSON(), nullable=False),
        sa.Column("beta", sa.Numeric(10, 4), nullable=False),
        sa.Column("work_norms", sa.JSON(), nullable=False),
        sa.Column("formulas", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("project_id", "version_number", name="uq_model_config_versions_project_version"),
    )
    op.create_index("ix_model_config_versions_project_id", "model_config_versions", ["project_id"])


def downgrade() -> None:
    op.drop_index("ix_model_config_versions_project_id", table_name="model_config_versions")
    op.drop_table("model_config_versions")
