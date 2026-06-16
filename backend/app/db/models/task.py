from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SqlEnum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import Base


class QualificationLevel(str, Enum):
    junior = "junior"
    middle = "middle"
    senior = "senior"


class ComplexityClass(str, Enum):
    S = "S"
    M = "M"
    L = "L"
    XL = "XL"


class TaskStatus(str, Enum):
    completed = "completed"
    in_progress = "in_progress"
    blocked = "blocked"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    sprint_id: Mapped[int | None] = mapped_column(ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True, index=True)
    external_task_id: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    area: Mapped[str | None] = mapped_column(String(255), nullable=True)
    story_points: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    complexity_class: Mapped[ComplexityClass] = mapped_column(SqlEnum(ComplexityClass, name="complexityclass"), nullable=False)
    planned_hours: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    actual_hours: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[TaskStatus] = mapped_column(
        SqlEnum(TaskStatus, name="taskstatus"),
        default=TaskStatus.in_progress,
        nullable=False,
    )
    external_dependency: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    project = relationship("Project", back_populates="tasks")
    sprint = relationship("Sprint", back_populates="tasks")
    assignments = relationship("TaskAssignment", back_populates="task", cascade="all, delete-orphan")


class TaskAssignment(Base):
    __tablename__ = "task_assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    participant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    qualification: Mapped[QualificationLevel] = mapped_column(
        SqlEnum(QualificationLevel, name="qualificationlevel"),
        nullable=False,
    )
    participant_hours: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    task = relationship("Task", back_populates="assignments")
