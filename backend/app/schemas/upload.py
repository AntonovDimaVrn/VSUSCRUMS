from datetime import datetime, date

from pydantic import BaseModel, ConfigDict

from app.db.models.task import ComplexityClass, QualificationLevel, TaskStatus
from app.db.models.upload import UploadStatus


class UploadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    original_filename: str
    storage_path: str | None
    status: UploadStatus
    records_count: int
    error_message: str | None
    uploaded_at: datetime
    processed_at: datetime | None


class ImportTemplateRow(BaseModel):
    task_id: str
    task_title: str
    sprint: str
    story_points: float
    complexity_class: ComplexityClass
    planned_hours: float
    actual_hours: float
    participant_name: str
    qualification: QualificationLevel
    participant_hours: float
    status: TaskStatus
    area: str
    external_dependency: bool
    sprint_start: date | None = None
    sprint_end: date | None = None


class ImportTemplateSpec(BaseModel):
    required_columns: list[str]
    optional_columns: list[str]
    sample_rows: list[ImportTemplateRow]


class ImportResult(BaseModel):
    upload: UploadRead
    created_tasks: int
    updated_tasks: int
    assignments_written: int
    sprints_touched: int
