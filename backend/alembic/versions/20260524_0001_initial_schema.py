"""Initial backend schema

Revision ID: 20260524_0001
Revises:
Create Date: 2026-05-24 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260524_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    qualification_enum = sa.Enum(
        "junior",
        "middle",
        "senior",
        "analyst",
        "pm",
        name="qualificationlevel",
    )
    complexity_enum = sa.Enum("S", "M", "L", "XL", name="complexityclass")
    task_status_enum = sa.Enum("completed", "in_progress", "blocked", name="taskstatus")
    upload_status_enum = sa.Enum("pending", "processed", "failed", name="uploadstatus")
    user_role_enum = sa.Enum("admin", "analyst", name="userrole")

    bind = op.get_bind()
    qualification_enum.create(bind, checkfirst=True)
    complexity_enum.create(bind, checkfirst=True)
    task_status_enum.create(bind, checkfirst=True)
    upload_status_enum.create(bind, checkfirst=True)
    user_role_enum.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=True),
        sa.Column("role", user_role_enum, nullable=False, server_default="analyst"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )

    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("name", name="uq_projects_name"),
    )

    op.create_table(
        "project_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=255), nullable=False),
        sa.Column("qualification", qualification_enum, nullable=False),
        sa.Column("capacity_hours", sa.Numeric(10, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_project_members_project_id", "project_members", ["project_id"])

    op.create_table(
        "uploads",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=True),
        sa.Column("status", upload_status_enum, nullable=False, server_default="pending"),
        sa.Column("records_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_uploads_project_id", "uploads", ["project_id"])

    op.create_table(
        "sprints",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("planned_story_points", sa.Numeric(10, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("project_id", "name", name="uq_sprints_project_name"),
    )
    op.create_index("ix_sprints_project_id", "sprints", ["project_id"])

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sprint_id", sa.Integer(), sa.ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True),
        sa.Column("external_task_id", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=True),
        sa.Column("area", sa.String(length=255), nullable=True),
        sa.Column("story_points", sa.Numeric(10, 2), nullable=False),
        sa.Column("complexity_class", complexity_enum, nullable=False),
        sa.Column("planned_hours", sa.Numeric(10, 2), nullable=False),
        sa.Column("actual_hours", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", task_status_enum, nullable=False, server_default="in_progress"),
        sa.Column("external_dependency", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("project_id", "external_task_id", name="uq_tasks_project_external_id"),
    )
    op.create_index("ix_tasks_project_id", "tasks", ["project_id"])
    op.create_index("ix_tasks_sprint_id", "tasks", ["sprint_id"])

    op.create_table(
        "task_assignments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("task_id", sa.Integer(), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("participant_name", sa.String(length=255), nullable=False),
        sa.Column("qualification", qualification_enum, nullable=False),
        sa.Column("participant_hours", sa.Numeric(10, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_task_assignments_task_id", "task_assignments", ["task_id"])


def downgrade() -> None:
    bind = op.get_bind()
    qualification_enum = sa.Enum(
        "junior",
        "middle",
        "senior",
        "analyst",
        "pm",
        name="qualificationlevel",
    )
    complexity_enum = sa.Enum("S", "M", "L", "XL", name="complexityclass")
    task_status_enum = sa.Enum("completed", "in_progress", "blocked", name="taskstatus")
    upload_status_enum = sa.Enum("pending", "processed", "failed", name="uploadstatus")
    user_role_enum = sa.Enum("admin", "analyst", name="userrole")

    op.drop_index("ix_task_assignments_task_id", table_name="task_assignments")
    op.drop_table("task_assignments")
    op.drop_index("ix_tasks_sprint_id", table_name="tasks")
    op.drop_index("ix_tasks_project_id", table_name="tasks")
    op.drop_table("tasks")
    op.drop_index("ix_sprints_project_id", table_name="sprints")
    op.drop_table("sprints")
    op.drop_index("ix_uploads_project_id", table_name="uploads")
    op.drop_table("uploads")
    op.drop_index("ix_project_members_project_id", table_name="project_members")
    op.drop_table("project_members")
    op.drop_table("projects")
    op.drop_table("users")

    qualification_enum.drop(bind, checkfirst=True)
    complexity_enum.drop(bind, checkfirst=True)
    task_status_enum.drop(bind, checkfirst=True)
    upload_status_enum.drop(bind, checkfirst=True)
    user_role_enum.drop(bind, checkfirst=True)
