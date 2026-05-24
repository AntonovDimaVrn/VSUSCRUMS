from __future__ import annotations

from dataclasses import dataclass
from math import log

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.models.model_config import ModelConfigVersion
from app.db.models.project import Project
from app.db.models.task import Task, TaskAssignment
from app.repositories.model_config import model_config_repository
from app.schemas.model_config import ModelConfigVersionPayload

DEFAULT_ALPHA_SCALE = {
    "junior": 0.6,
    "middle": 1.0,
    "senior": 1.4,
    "analyst": 0.9,
    "pm": 0.55,
}

DEFAULT_WORK_NORMS = {
    "S": 4.0,
    "M": 4.8,
    "L": 5.6,
    "XL": 6.4,
}

DEFAULT_FORMULAS = {
    "weighted_qualification": "weighted_alpha_hours / total_participant_hours",
    "communication_factor": "max(0.45, 1 - beta * ((participant_count - 1) / participant_count))",
    "optimal_time": "(work_norm * story_points) / (weighted_qualification * communication_factor)",
    "efficiency_index": "optimal_time / actual_hours",
    "deviation_percent": "((actual_hours - planned_hours) / planned_hours) * 100",
    "on_time_probability": "phi((ln_planned_hours - mu) / sigma)",
    "backlog_completion_index": "(completed_story_points / planned_story_points) * 100",
    "sprint_efficiency_index": "geometric_mean(task_efficiency_indexes)",
}


@dataclass
class ProjectTaskSnapshot:
    story_points: float
    complexity_class: str
    actual_hours: float
    assignments: list[TaskAssignment]
    status: str


def mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def median(values: list[float]) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    middle = len(ordered) // 2
    if len(ordered) % 2 == 0:
        return (ordered[middle - 1] + ordered[middle]) / 2
    return ordered[middle]


def round_to(value: float, digits: int = 3) -> float:
    factor = 10**digits
    return round(value * factor) / factor


def get_or_create_active_model_version(db: Session, project: Project) -> ModelConfigVersion:
    existing = model_config_repository.get_active(db, project.id)
    if existing is not None:
        return existing

    payload = build_default_model_payload(db, project)
    version = ModelConfigVersion(
        project_id=project.id,
        version_number=1,
        is_active=True,
        change_note="Инициализация математической модели проекта.",
        alpha_scale=payload.alpha_scale,
        beta=payload.beta,
        work_norms=payload.work_norms,
        formulas=payload.formulas,
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


def build_default_model_payload(db: Session, project: Project) -> ModelConfigVersionPayload:
    snapshots = _load_project_task_snapshots(db, project.id)
    beta = derive_beta(snapshots, DEFAULT_ALPHA_SCALE)
    work_norms = derive_work_norms(snapshots, beta, DEFAULT_ALPHA_SCALE)
    return ModelConfigVersionPayload(
        alpha_scale=DEFAULT_ALPHA_SCALE,
        beta=beta,
        work_norms=work_norms,
        formulas=DEFAULT_FORMULAS,
        change_note="Инициализация математической модели проекта.",
    )


def create_model_version(
    db: Session,
    project: Project,
    payload: ModelConfigVersionPayload,
) -> ModelConfigVersion:
    _validate_payload(payload)

    for version in model_config_repository.list_by_project(db, project.id):
        if version.is_active:
            version.is_active = False
            db.add(version)

    next_version = model_config_repository.get_latest_version_number(db, project.id) + 1
    version = ModelConfigVersion(
        project_id=project.id,
        version_number=next_version,
        is_active=True,
        change_note=payload.change_note,
        alpha_scale=payload.alpha_scale,
        beta=payload.beta,
        work_norms=payload.work_norms,
        formulas=payload.formulas,
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


def restore_model_version(db: Session, project: Project, source: ModelConfigVersion) -> ModelConfigVersion:
    payload = ModelConfigVersionPayload(
        alpha_scale=source.alpha_scale,
        beta=float(source.beta),
        work_norms=source.work_norms,
        formulas=source.formulas,
        change_note=f"Восстановлено из версии {source.version_number}.",
    )
    return create_model_version(db, project, payload)


def derive_work_norms(
    tasks: list[ProjectTaskSnapshot],
    beta: float,
    alpha_scale: dict[str, float],
) -> dict[str, float]:
    norms_by_complexity: dict[str, list[float]] = {key: [] for key in DEFAULT_WORK_NORMS}
    completed_tasks = [task for task in tasks if task.status == "completed"]
    for task in completed_tasks:
        weighted_qualification = _weighted_qualification_from_assignments(task.assignments, alpha_scale)
        participant_count = len(task.assignments)
        communication_factor = max(0.45, 1 - beta * ((participant_count - 1) / participant_count))
        norm = (task.actual_hours * weighted_qualification * communication_factor) / task.story_points
        norms_by_complexity[task.complexity_class].append(norm)

    all_values = [value for values in norms_by_complexity.values() for value in values]
    fallback = median(all_values) if all_values else 5.0

    derived: dict[str, float] = {}
    for code, default_value in DEFAULT_WORK_NORMS.items():
        values = norms_by_complexity[code]
        derived[code] = round_to(median(values) if values else fallback or default_value, 3)
    return derived


def derive_beta(tasks: list[ProjectTaskSnapshot], alpha_scale: dict[str, float]) -> float:
    completed_tasks = [task for task in tasks if task.status == "completed"]
    if len(completed_tasks) < 2:
        return 0.28

    best_beta = 0.28
    best_score = float("inf")
    for raw_beta in range(5, 61):
        beta = raw_beta / 100
        norms = derive_work_norms(tasks, beta, alpha_scale)
        score_values: list[float] = []
        for task in completed_tasks:
            weighted_qualification = _weighted_qualification_from_assignments(task.assignments, alpha_scale)
            participant_count = len(task.assignments)
            communication_factor = max(0.45, 1 - beta * ((participant_count - 1) / participant_count))
            modeled_hours = (norms[task.complexity_class] * task.story_points) / (
                weighted_qualification * communication_factor
            )
            score_values.append(abs(log(modeled_hours / task.actual_hours)))
        score = mean(score_values)
        if score < best_score:
            best_score = score
            best_beta = beta

    return round_to(best_beta, 2)


def _load_project_task_snapshots(db: Session, project_id: int) -> list[ProjectTaskSnapshot]:
    statement = (
        select(Task)
        .where(Task.project_id == project_id)
        .options(selectinload(Task.assignments))
    )
    tasks = db.scalars(statement).all()
    return [
        ProjectTaskSnapshot(
            story_points=float(task.story_points),
            complexity_class=task.complexity_class.value,
            actual_hours=float(task.actual_hours),
            assignments=list(task.assignments),
            status=task.status.value,
        )
        for task in tasks
    ]


def _weighted_qualification_from_assignments(
    assignments: list[TaskAssignment],
    alpha_scale: dict[str, float],
) -> float:
    total_hours = sum(float(assignment.participant_hours) for assignment in assignments)
    if total_hours <= 0:
        return 1.0
    weighted_hours = sum(
        float(assignment.participant_hours) * alpha_scale[assignment.qualification.value]
        for assignment in assignments
    )
    return weighted_hours / total_hours


def _validate_payload(payload: ModelConfigVersionPayload) -> None:
    expected_roles = set(DEFAULT_ALPHA_SCALE)
    expected_complexities = set(DEFAULT_WORK_NORMS)
    expected_formulas = set(DEFAULT_FORMULAS)

    if set(payload.alpha_scale) != expected_roles:
        raise ValueError("alpha_scale должен содержать junior, middle, senior, analyst, pm.")
    if set(payload.work_norms) != expected_complexities:
        raise ValueError("work_norms должен содержать S, M, L, XL.")
    missing_formulas = expected_formulas - set(payload.formulas)
    if missing_formulas:
        raise ValueError(f"Отсутствуют формулы: {', '.join(sorted(missing_formulas))}.")
