from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, Numeric, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import Base


class ModelConfigVersion(Base):
    __tablename__ = "model_config_versions"
    __table_args__ = (
        UniqueConstraint("project_id", "version_number", name="uq_model_config_versions_project_version"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    change_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    alpha_scale: Mapped[dict[str, float]] = mapped_column(JSON, nullable=False)
    beta: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    work_norms: Mapped[dict[str, float]] = mapped_column(JSON, nullable=False)
    formulas: Mapped[dict[str, str]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    project = relationship("Project", back_populates="model_versions")
