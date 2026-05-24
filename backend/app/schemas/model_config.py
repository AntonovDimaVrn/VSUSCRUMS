from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ModelConfigVersionPayload(BaseModel):
    alpha_scale: dict[str, float] = Field(min_length=5)
    beta: float = Field(gt=0, le=1)
    work_norms: dict[str, float] = Field(min_length=4)
    formulas: dict[str, str] = Field(min_length=1)
    change_note: str | None = None


class ModelConfigVersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    version_number: int
    is_active: bool
    change_note: str | None
    alpha_scale: dict[str, float]
    beta: float
    work_norms: dict[str, float]
    formulas: dict[str, str]
    created_at: datetime


class ModelConfigVersionHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    version_number: int
    is_active: bool
    change_note: str | None
    created_at: datetime
