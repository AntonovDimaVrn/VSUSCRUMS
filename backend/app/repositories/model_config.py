from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.model_config import ModelConfigVersion


class ModelConfigRepository:
    def get_active(self, db: Session, project_id: int) -> ModelConfigVersion | None:
        statement = (
            select(ModelConfigVersion)
            .where(ModelConfigVersion.project_id == project_id, ModelConfigVersion.is_active.is_(True))
            .order_by(ModelConfigVersion.version_number.desc())
        )
        return db.scalar(statement)

    def get(self, db: Session, version_id: int) -> ModelConfigVersion | None:
        return db.get(ModelConfigVersion, version_id)

    def list_by_project(self, db: Session, project_id: int) -> list[ModelConfigVersion]:
        statement = (
            select(ModelConfigVersion)
            .where(ModelConfigVersion.project_id == project_id)
            .order_by(ModelConfigVersion.version_number.desc())
        )
        return list(db.scalars(statement).all())

    def get_latest_version_number(self, db: Session, project_id: int) -> int:
        statement = (
            select(ModelConfigVersion.version_number)
            .where(ModelConfigVersion.project_id == project_id)
            .order_by(ModelConfigVersion.version_number.desc())
            .limit(1)
        )
        latest = db.scalar(statement)
        return int(latest or 0)


model_config_repository = ModelConfigRepository()
