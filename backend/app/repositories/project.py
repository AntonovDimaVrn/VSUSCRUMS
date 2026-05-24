from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectRepository:
    def list(self, db: Session) -> list[Project]:
        statement = select(Project).order_by(Project.created_at.desc())
        return list(db.scalars(statement).all())

    def get(self, db: Session, project_id: int) -> Project | None:
        return db.get(Project, project_id)

    def get_by_name(self, db: Session, name: str) -> Project | None:
        statement = select(Project).where(Project.name == name)
        return db.scalar(statement)

    def create(self, db: Session, payload: ProjectCreate) -> Project:
        project = Project(name=payload.name.strip(), description=payload.description)
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    def update(self, db: Session, project: Project, payload: ProjectUpdate) -> Project:
        if payload.name is not None:
            project.name = payload.name.strip()
        if payload.description is not None:
            project.description = payload.description
        db.add(project)
        db.commit()
        db.refresh(project)
        return project


project_repository = ProjectRepository()
