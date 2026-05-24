from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.upload import Upload


class UploadRepository:
    def list_by_project(self, db: Session, project_id: int) -> list[Upload]:
        statement = (
            select(Upload)
            .where(Upload.project_id == project_id)
            .order_by(Upload.uploaded_at.desc())
        )
        return list(db.scalars(statement).all())

    def create(self, db: Session, upload: Upload) -> Upload:
        db.add(upload)
        db.commit()
        db.refresh(upload)
        return upload

    def save(self, db: Session, upload: Upload) -> Upload:
        db.add(upload)
        db.commit()
        db.refresh(upload)
        return upload


upload_repository = UploadRepository()
