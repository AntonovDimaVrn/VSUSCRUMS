from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.repositories.project import project_repository
from app.repositories.upload import upload_repository
from app.repositories.model_config import model_config_repository
from app.schemas.model_config import (
    ModelConfigVersionHistoryItem,
    ModelConfigVersionPayload,
    ModelConfigVersionRead,
)
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.schemas.upload import ImportResult, ImportTemplateSpec, UploadRead
from app.services.analytics import build_project_analytics
from app.services.excel_import import (
    ExcelImportError,
    TEMPLATE_FILE_PATH,
    get_import_template_spec,
    import_excel_for_project,
)
from app.services.model_config import (
    create_model_version,
    get_or_create_active_model_version,
    restore_model_version,
)

router = APIRouter()


@router.get("", response_model=list[ProjectRead])
def list_projects(db: Session = Depends(get_db)) -> list[ProjectRead]:
    return project_repository.list(db)


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)) -> ProjectRead:
    existing = project_repository.get_by_name(db, payload.name)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project with this name already exists.",
        )
    return project_repository.create(db, payload)


@router.get("/import-template/spec", response_model=ImportTemplateSpec)
def get_import_template() -> ImportTemplateSpec:
    return ImportTemplateSpec(**get_import_template_spec())


@router.get("/import-template/xlsx")
def download_import_template() -> FileResponse:
    if not TEMPLATE_FILE_PATH.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template file is not available yet.",
        )
    return FileResponse(
        TEMPLATE_FILE_PATH,
        filename="scrummetrics_import_template.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, db: Session = Depends(get_db)) -> ProjectRead:
    project = project_repository.get(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return project


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
) -> ProjectRead:
    project = project_repository.get(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    if payload.name:
        duplicate = project_repository.get_by_name(db, payload.name)
        if duplicate is not None and duplicate.id != project_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Project with this name already exists.",
            )

    return project_repository.update(db, project, payload)


@router.get("/{project_id}/uploads", response_model=list[UploadRead])
def list_project_uploads(project_id: int, db: Session = Depends(get_db)) -> list[UploadRead]:
    project = project_repository.get(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return upload_repository.list_by_project(db, project_id)


@router.get("/{project_id}/analytics")
def get_project_analytics(project_id: int, db: Session = Depends(get_db)) -> dict:
    project = project_repository.get(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return build_project_analytics(db, project)


@router.get("/{project_id}/model", response_model=ModelConfigVersionRead)
def get_project_model(project_id: int, db: Session = Depends(get_db)) -> ModelConfigVersionRead:
    project = project_repository.get(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    version = get_or_create_active_model_version(db, project)
    return ModelConfigVersionRead.model_validate(version)


@router.get("/{project_id}/model/history", response_model=list[ModelConfigVersionHistoryItem])
def get_project_model_history(project_id: int, db: Session = Depends(get_db)) -> list[ModelConfigVersionHistoryItem]:
    project = project_repository.get(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    versions = model_config_repository.list_by_project(db, project_id)
    return [ModelConfigVersionHistoryItem.model_validate(version) for version in versions]


@router.post(
    "/{project_id}/model/versions",
    response_model=ModelConfigVersionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_project_model_version(
    project_id: int,
    payload: ModelConfigVersionPayload,
    db: Session = Depends(get_db),
) -> ModelConfigVersionRead:
    project = project_repository.get(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    try:
        version = create_model_version(db, project, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    return ModelConfigVersionRead.model_validate(version)


@router.post("/{project_id}/model/history/{version_id}/restore", response_model=ModelConfigVersionRead)
def restore_project_model_version(
    project_id: int,
    version_id: int,
    db: Session = Depends(get_db),
) -> ModelConfigVersionRead:
    project = project_repository.get(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    source = model_config_repository.get(db, version_id)
    if source is None or source.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model version not found.")

    version = restore_model_version(db, project, source)
    return ModelConfigVersionRead.model_validate(version)


@router.post("/{project_id}/uploads/excel", response_model=ImportResult, status_code=status.HTTP_201_CREATED)
async def upload_project_excel(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ImportResult:
    project = project_repository.get(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    try:
        upload, summary = await import_excel_for_project(db, project, file)
    except ExcelImportError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    return ImportResult(
        upload=UploadRead.model_validate(upload),
        created_tasks=summary.created_tasks,
        updated_tasks=summary.updated_tasks,
        assignments_written=summary.assignments_written,
        sprints_touched=summary.sprints_touched,
    )
