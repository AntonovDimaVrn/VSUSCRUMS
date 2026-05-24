from __future__ import annotations

import ast
import math
from collections import Counter
from dataclasses import dataclass
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.models.project import Project, ProjectMember
from app.db.models.sprint import Sprint
from app.db.models.task import Task
from app.services.model_config import (
    DEFAULT_FORMULAS,
    DEFAULT_WORK_NORMS,
    get_or_create_active_model_version,
)


@dataclass
class ModeledParticipant:
    name: str
    role: str
    qualification: str
    hours: float
    alpha: float


@dataclass
class ModeledTask:
    id: str
    title: str
    sprint_id: int | None
    sprint_name: str
    story_points: float
    complexity: str
    planned_hours: float
    actual_hours: float
    status: str
    participant_count: int
    weighted_qualification: float
    communication_factor: float
    optimal_hours: float
    efficiency_index: float
    deviation_percent: float
    on_time_probability: float
    area: str | None
    participants: list[ModeledParticipant]
    has_junior_contributor: bool
    external_dependency: bool


def round_to(value: float, digits: int = 2) -> float:
    factor = 10**digits
    return round(value * factor) / factor


def mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def geometric_mean(values: list[float]) -> float:
    safe_values = [value for value in values if value > 0]
    if not safe_values:
        return 0.0
    return math.exp(mean([math.log(value) for value in safe_values]))


def median(values: list[float]) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    middle = len(ordered) // 2
    if len(ordered) % 2 == 0:
        return (ordered[middle - 1] + ordered[middle]) / 2
    return ordered[middle]


def erf(x: float) -> float:
    sign = 1 if x >= 0 else -1
    absolute = abs(x)
    a1 = 0.254829592
    a2 = -0.284496736
    a3 = 1.421413741
    a4 = -1.453152027
    a5 = 1.061405429
    p = 0.3275911
    t = 1 / (1 + p * absolute)
    y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * math.exp(-absolute * absolute))
    return sign * y


def normal_cdf(value: float) -> float:
    return 0.5 * (1 + erf(value / math.sqrt(2)))


class FormulaEvaluationError(Exception):
    pass


class SafeFormulaEvaluator:
    ALLOWED_BIN_OPS = {
        ast.Add: lambda left, right: left + right,
        ast.Sub: lambda left, right: left - right,
        ast.Mult: lambda left, right: left * right,
        ast.Div: lambda left, right: left / right,
        ast.Pow: lambda left, right: left**right,
        ast.Mod: lambda left, right: left % right,
    }
    ALLOWED_UNARY_OPS = {
        ast.UAdd: lambda value: +value,
        ast.USub: lambda value: -value,
    }
    ALLOWED_FUNCTIONS = {
        "abs": abs,
        "exp": math.exp,
        "geometric_mean": geometric_mean,
        "ln": math.log,
        "log": math.log,
        "max": max,
        "min": min,
        "phi": normal_cdf,
        "round": round,
        "sqrt": math.sqrt,
    }

    @classmethod
    def evaluate(cls, expression: str, context: dict[str, float | list[float]]) -> float:
        try:
            node = ast.parse(expression, mode="eval")
        except SyntaxError as exc:
            raise FormulaEvaluationError(f"Некорректный синтаксис формулы: {expression}") from exc
        return float(cls._evaluate_node(node.body, context))

    @classmethod
    def _evaluate_node(cls, node: ast.AST, context: dict[str, float | list[float]]):
        if isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return node.value
            raise FormulaEvaluationError("Поддерживаются только числовые константы.")
        if isinstance(node, ast.Name):
            if node.id not in context:
                raise FormulaEvaluationError(f"Неизвестная переменная {node.id}.")
            return context[node.id]
        if isinstance(node, ast.BinOp):
            operator = cls.ALLOWED_BIN_OPS.get(type(node.op))
            if operator is None:
                raise FormulaEvaluationError("Операция не поддерживается.")
            return operator(cls._evaluate_node(node.left, context), cls._evaluate_node(node.right, context))
        if isinstance(node, ast.UnaryOp):
            operator = cls.ALLOWED_UNARY_OPS.get(type(node.op))
            if operator is None:
                raise FormulaEvaluationError("Унарная операция не поддерживается.")
            return operator(cls._evaluate_node(node.operand, context))
        if isinstance(node, ast.Call):
            if not isinstance(node.func, ast.Name):
                raise FormulaEvaluationError("Разрешены только простые функции.")
            function = cls.ALLOWED_FUNCTIONS.get(node.func.id)
            if function is None:
                raise FormulaEvaluationError(f"Функция {node.func.id} не поддерживается.")
            arguments = [cls._evaluate_node(argument, context) for argument in node.args]
            return function(*arguments)
        raise FormulaEvaluationError("Формула содержит неподдерживаемую конструкцию.")


def transpose(matrix: list[list[float]]) -> list[list[float]]:
    return [list(column) for column in zip(*matrix)]


def multiply_matrices(left: list[list[float]], right: list[list[float]]) -> list[list[float]]:
    return [
        [
            sum(left[row_index][value_index] * right[value_index][column_index] for value_index in range(len(right)))
            for column_index in range(len(right[0]))
        ]
        for row_index in range(len(left))
    ]


def multiply_matrix_vector(matrix: list[list[float]], vector: list[float]) -> list[float]:
    return [sum(value * vector[index] for index, value in enumerate(row)) for row in matrix]


def invert_matrix(matrix: list[list[float]]) -> list[list[float]] | None:
    size = len(matrix)
    augmented = [
        [value + (1e-6 if row_index == column_index else 0) for column_index, value in enumerate(row)]
        + [1 if row_index == column_index else 0 for column_index in range(size)]
        for row_index, row in enumerate(matrix)
    ]

    for pivot in range(size):
        max_row = max(range(pivot, size), key=lambda row_index: abs(augmented[row_index][pivot]))
        augmented[pivot], augmented[max_row] = augmented[max_row], augmented[pivot]
        pivot_value = augmented[pivot][pivot]
        if abs(pivot_value) < 1e-10:
            return None
        for column in range(size * 2):
            augmented[pivot][column] /= pivot_value
        for row in range(size):
            if row == pivot:
                continue
            factor = augmented[row][pivot]
            for column in range(size * 2):
                augmented[row][column] -= factor * augmented[pivot][column]

    return [row[size:] for row in augmented]


def solve_regression_coefficients(features: list[list[float]], target: list[float]) -> list[float]:
    if not features:
        return [0.0, 0.0, 0.0, 0.0]
    x_transpose = transpose(features)
    xtx = multiply_matrices(x_transpose, features)
    xtx_inverse = invert_matrix(xtx)
    if xtx_inverse is None:
        return [0.0, 0.0, 0.0, 0.0]
    xty = multiply_matrix_vector(x_transpose, target)
    return multiply_matrix_vector(xtx_inverse, xty)


def build_project_analytics(db: Session, project: Project) -> dict:
    active_model = get_or_create_active_model_version(db, project)
    tasks = _load_project_tasks(db, project.id)
    sprints = _load_project_sprints(db, project.id)
    project_members = _load_project_members(db, project.id)

    if not tasks or not sprints:
        return _empty_analytics(project, active_model)

    alpha_scale = {key: float(value) for key, value in active_model.alpha_scale.items()}
    beta = float(active_model.beta)
    work_norms = {key: float(value) for key, value in active_model.work_norms.items()}
    formulas = {**DEFAULT_FORMULAS, **active_model.formulas}

    sprint_by_id = {sprint.id: sprint for sprint in sprints}
    log_normal_params = derive_log_normal_params(tasks)

    modeled_tasks = [
        build_modeled_task(task, sprint_by_id, alpha_scale, beta, work_norms, formulas, log_normal_params)
        for task in tasks
    ]

    regression = derive_regression(modeled_tasks)
    sprint_series = build_sprint_series(modeled_tasks, sprints, formulas)
    current_sprint = choose_current_sprint(sprints)
    current_sprint_tasks = [task for task in modeled_tasks if task.sprint_id == current_sprint.id]
    current_completed_tasks = [task for task in current_sprint_tasks if task.status == "completed"]
    current_carryover_tasks = [task for task in current_sprint_tasks if task.status != "completed"]
    current_completed_story_points = sum(task.story_points for task in current_completed_tasks)

    backlog_completion_index = round_to(
        evaluate_formula(
            formulas["backlog_completion_index"],
            {
                "completed_story_points": current_completed_story_points,
                "planned_story_points": float(current_sprint.planned_story_points or 0),
            },
            fallback=(current_completed_story_points / float(current_sprint.planned_story_points or 1)) * 100,
        ),
        1,
    )
    sprint_efficiency_index = round_to(
        evaluate_formula(
            formulas["sprint_efficiency_index"],
            {"task_efficiency_indexes": [task.efficiency_index for task in current_completed_tasks]},
            fallback=geometric_mean([task.efficiency_index for task in current_completed_tasks]),
        ),
        3,
    )

    problematic_tasks = build_problematic_tasks(current_sprint_tasks)
    probability_buckets = build_probability_buckets(current_sprint_tasks)
    member_stats = build_member_stats(current_sprint_tasks, project_members)
    complexity_by_role = build_complexity_by_role(current_sprint_tasks, member_stats)
    complexity_distribution = build_complexity_distribution(modeled_tasks)
    estimate_accuracy = round_to(
        max(0, 100 - mean([abs(task.deviation_percent) for task in current_completed_tasks])),
        1,
    )
    risk_score = round_to(
        min(
            10,
            len(problematic_tasks) * 1.4
            + len(current_carryover_tasks) * 1.8
            + max(0, 85 - backlog_completion_index) / 12
            + max(0, 1 - sprint_efficiency_index) * 6,
        ),
        1,
    )
    risk_label = "Высокий" if risk_score >= 7 else "Средний" if risk_score >= 4 else "Низкий"
    recommendations = build_recommendations(
        modeled_tasks,
        sprints,
        current_sprint,
        current_sprint_tasks,
        current_carryover_tasks,
        current_completed_tasks,
        backlog_completion_index,
        sprint_efficiency_index,
        member_stats,
        beta,
        work_norms,
    )

    average_velocity = round_to(mean([item["completed"] for item in sprint_series]), 1)
    average_task_probability = round_to(mean([task.on_time_probability for task in current_sprint_tasks]) * 100, 1)

    return {
        "hasData": True,
        "projectName": project.name,
        "alphaScale": alpha_scale,
        "beta": beta,
        "workNorms": work_norms,
        "logNormalParams": log_normal_params,
        "regression": regression,
        "dashboard": {
            "averageVelocity": average_velocity,
            "estimateAccuracy": estimate_accuracy,
            "currentBacklogCompletion": backlog_completion_index,
            "riskScore": risk_score,
            "riskLabel": risk_label,
            "sprintSeries": sprint_series,
            "complexityDistribution": complexity_distribution,
            "modelSummary": [
                {
                    "label": "β Брукса",
                    "value": str(beta).replace(".", ","),
                    "note": "Коэффициент коммуникационных потерь",
                },
                {
                    "label": "w(S/M/L/XL)",
                    "value": f"{work_norms['S']}/{work_norms['M']}/{work_norms['L']}/{work_norms['XL']}",
                    "note": "Норматив трудоёмкости в часах на Story Point",
                },
                {
                    "label": "Регрессия ln(Tfact)",
                    "value": (
                        f"{regression['intercept']} + {regression['sp']}·SP "
                        f"{'-' if regression['qualification'] < 0 else '+'} {abs(regression['qualification'])}·Q "
                        f"{'-' if regression['participants'] < 0 else '+'} {abs(regression['participants'])}·M"
                    ),
                    "note": "Оценка вклада SP, квалификации и размера команды",
                },
            ],
        },
        "sprint": {
            "sprintName": current_sprint.name,
            "dateLabel": format_sprint_date_label(current_sprint.start_date, current_sprint.end_date),
            "durationDays": duration_days(current_sprint.start_date, current_sprint.end_date),
            "plannedStoryPoints": float(current_sprint.planned_story_points or 0),
            "completedStoryPoints": round_to(current_completed_story_points, 1),
            "backlogCompletionIndex": backlog_completion_index,
            "sprintEfficiencyIndex": sprint_efficiency_index,
            "averageTaskProbability": average_task_probability,
            "riskyTaskCount": len(problematic_tasks),
            "carryoverTasks": [serialize_modeled_task(task) for task in current_carryover_tasks],
            "problematicTasks": problematic_tasks,
            "probabilityBuckets": probability_buckets,
        },
        "team": {
            "totalMembers": len(member_stats),
            "overloadedCount": len([member for member in member_stats if member["status"] == "overloaded"]),
            "averageUtilization": round_to(mean([member["utilizationPercent"] for member in member_stats]), 1),
            "members": member_stats,
            "loadDistribution": [
                {"name": member["name"], "workload": member["workload"], "capacity": member["capacity"]}
                for member in member_stats
            ],
            "complexityByRole": complexity_by_role,
        },
        "recommendations": recommendations,
        "previewRows": [
            {
                "id": task.id,
                "sprint": task.sprint_name,
                "storyPoints": task.story_points,
                "complexity": task.complexity,
                "participants": task.participant_count,
                "plannedHours": task.planned_hours,
                "actualHours": task.actual_hours,
            }
            for task in current_sprint_tasks[:5]
        ],
        "uploadFields": [
            "task_id",
            "sprint",
            "story_points",
            "complexity_class",
            "planned_hours",
            "actual_hours",
            "participant_name",
            "qualification",
            "participant_hours",
        ],
    }


def _empty_analytics(project: Project, active_model) -> dict:
    return {
        "hasData": False,
        "projectName": project.name,
        "alphaScale": {key: float(value) for key, value in active_model.alpha_scale.items()},
        "beta": float(active_model.beta),
        "workNorms": {key: float(value) for key, value in active_model.work_norms.items()},
        "logNormalParams": {key: {"mu": 0, "sigma": 0.05} for key in DEFAULT_WORK_NORMS},
        "regression": {"intercept": 0, "sp": 0, "qualification": 0, "participants": 0},
        "dashboard": {
            "averageVelocity": 0,
            "estimateAccuracy": 0,
            "currentBacklogCompletion": 0,
            "riskScore": 0,
            "riskLabel": "Нет данных",
            "sprintSeries": [],
            "complexityDistribution": [],
            "modelSummary": [],
        },
        "sprint": {
            "sprintName": "Нет спринтов",
            "dateLabel": "Загрузите данные проекта",
            "durationDays": 0,
            "plannedStoryPoints": 0,
            "completedStoryPoints": 0,
            "backlogCompletionIndex": 0,
            "sprintEfficiencyIndex": 0,
            "averageTaskProbability": 0,
            "riskyTaskCount": 0,
            "carryoverTasks": [],
            "problematicTasks": [],
            "probabilityBuckets": [],
        },
        "team": {
            "totalMembers": 0,
            "overloadedCount": 0,
            "averageUtilization": 0,
            "members": [],
            "loadDistribution": [],
            "complexityByRole": [],
        },
        "recommendations": [],
        "previewRows": [],
        "uploadFields": [
            "task_id",
            "sprint",
            "story_points",
            "complexity_class",
            "planned_hours",
            "actual_hours",
            "participant_name",
            "qualification",
            "participant_hours",
        ],
    }


def _load_project_tasks(db: Session, project_id: int) -> list[Task]:
    statement = (
        select(Task)
        .where(Task.project_id == project_id)
        .options(selectinload(Task.assignments), selectinload(Task.sprint))
        .order_by(Task.id.asc())
    )
    return list(db.scalars(statement).all())


def _load_project_sprints(db: Session, project_id: int) -> list[Sprint]:
    statement = select(Sprint).where(Sprint.project_id == project_id).order_by(Sprint.start_date.asc(), Sprint.id.asc())
    return list(db.scalars(statement).all())


def _load_project_members(db: Session, project_id: int) -> list[ProjectMember]:
    statement = select(ProjectMember).where(ProjectMember.project_id == project_id)
    return list(db.scalars(statement).all())


def derive_log_normal_params(tasks: list[Task]) -> dict[str, dict[str, float]]:
    grouped = {key: [] for key in DEFAULT_WORK_NORMS}
    completed_tasks = [task for task in tasks if task.status.value == "completed"]
    for task in completed_tasks:
        grouped[task.complexity_class.value].append(math.log(float(task.actual_hours)))

    all_log_values = [math.log(float(task.actual_hours)) for task in completed_tasks]
    fallback_mu = mean(all_log_values)
    fallback_sigma = math.sqrt(mean([(value - fallback_mu) ** 2 for value in all_log_values])) if all_log_values else 0.05

    def build(values: list[float]) -> dict[str, float]:
        if len(values) < 2:
            return {"mu": round_to(fallback_mu, 3), "sigma": round_to(max(fallback_sigma, 0.05), 3)}
        mu = mean(values)
        sigma = math.sqrt(mean([(value - mu) ** 2 for value in values]))
        return {"mu": round_to(mu, 3), "sigma": round_to(max(sigma, 0.05), 3)}

    return {code: build(values) for code, values in grouped.items()}


def build_modeled_task(
    task: Task,
    sprint_by_id: dict[int, Sprint],
    alpha_scale: dict[str, float],
    beta: float,
    work_norms: dict[str, float],
    formulas: dict[str, str],
    log_normal_params: dict[str, dict[str, float]],
) -> ModeledTask:
    sprint = sprint_by_id.get(task.sprint_id) if task.sprint_id is not None else None
    participants = []
    total_participant_hours = 0.0
    weighted_alpha_hours = 0.0
    for assignment in task.assignments:
        hours = float(assignment.participant_hours)
        qualification = assignment.qualification.value
        alpha = float(alpha_scale[qualification])
        total_participant_hours += hours
        weighted_alpha_hours += hours * alpha
        participants.append(
            ModeledParticipant(
                name=assignment.participant_name,
                role=role_label_from_qualification(qualification),
                qualification=qualification,
                hours=hours,
                alpha=alpha,
            )
        )

    weighted_qualification = evaluate_formula(
        formulas["weighted_qualification"],
        {
            "weighted_alpha_hours": weighted_alpha_hours,
            "total_participant_hours": total_participant_hours or 1.0,
        },
        fallback=(weighted_alpha_hours / total_participant_hours) if total_participant_hours else 1.0,
    )
    participant_count = max(len(task.assignments), 1)
    communication_factor = evaluate_formula(
        formulas["communication_factor"],
        {"beta": beta, "participant_count": participant_count},
        fallback=max(0.45, 1 - beta * ((participant_count - 1) / participant_count)),
    )
    work_norm = float(work_norms[task.complexity_class.value])
    story_points = float(task.story_points)
    planned_hours = float(task.planned_hours)
    actual_hours = float(task.actual_hours)
    optimal_hours = evaluate_formula(
        formulas["optimal_time"],
        {
            "work_norm": work_norm,
            "story_points": story_points,
            "weighted_qualification": weighted_qualification,
            "communication_factor": communication_factor,
        },
        fallback=(work_norm * story_points) / max(weighted_qualification * communication_factor, 1e-6),
    )
    efficiency_index = evaluate_formula(
        formulas["efficiency_index"],
        {"optimal_time": optimal_hours, "actual_hours": actual_hours},
        fallback=optimal_hours / max(actual_hours, 1e-6),
    )
    deviation_percent = evaluate_formula(
        formulas["deviation_percent"],
        {"actual_hours": actual_hours, "planned_hours": planned_hours},
        fallback=((actual_hours - planned_hours) / max(planned_hours, 1e-6)) * 100,
    )
    params = log_normal_params[task.complexity_class.value]
    on_time_probability = evaluate_formula(
        formulas["on_time_probability"],
        {
            "ln_planned_hours": math.log(max(planned_hours, 1e-6)),
            "mu": params["mu"],
            "sigma": max(params["sigma"], 0.05),
        },
        fallback=normal_cdf((math.log(max(planned_hours, 1e-6)) - params["mu"]) / max(params["sigma"], 0.05)),
    )

    return ModeledTask(
        id=task.external_task_id,
        title=task.title or task.external_task_id,
        sprint_id=task.sprint_id,
        sprint_name=sprint.name if sprint is not None else "Без спринта",
        story_points=story_points,
        complexity=task.complexity_class.value,
        planned_hours=planned_hours,
        actual_hours=actual_hours,
        status=task.status.value,
        participant_count=participant_count,
        weighted_qualification=round_to(weighted_qualification, 3),
        communication_factor=round_to(communication_factor, 3),
        optimal_hours=round_to(optimal_hours, 2),
        efficiency_index=round_to(efficiency_index, 3),
        deviation_percent=round_to(deviation_percent, 1),
        on_time_probability=round_to(on_time_probability, 3),
        area=task.area,
        participants=participants,
        has_junior_contributor=any(participant.qualification == "junior" for participant in participants),
        external_dependency=bool(task.external_dependency),
    )


def evaluate_formula(expression: str, context: dict, fallback: float) -> float:
    try:
        return SafeFormulaEvaluator.evaluate(expression, context)
    except Exception:
        return fallback


def derive_regression(modeled_tasks: list[ModeledTask]) -> dict[str, float]:
    completed_tasks = [task for task in modeled_tasks if task.status == "completed"]
    coefficients = solve_regression_coefficients(
        [[1, task.story_points, task.weighted_qualification, task.participant_count] for task in completed_tasks],
        [math.log(max(task.actual_hours, 1e-6)) for task in completed_tasks],
    )
    return {
        "intercept": round_to(coefficients[0], 3),
        "sp": round_to(coefficients[1], 3),
        "qualification": round_to(coefficients[2], 3),
        "participants": round_to(coefficients[3], 3),
    }


def build_sprint_series(modeled_tasks: list[ModeledTask], sprints: list[Sprint], formulas: dict[str, str]) -> list[dict]:
    series = []
    for sprint in sprints:
        sprint_tasks = [task for task in modeled_tasks if task.sprint_id == sprint.id]
        completed_tasks = [task for task in sprint_tasks if task.status == "completed"]
        completed_points = sum(task.story_points for task in completed_tasks)
        sprint_ei = evaluate_formula(
            formulas["sprint_efficiency_index"],
            {"task_efficiency_indexes": [task.efficiency_index for task in completed_tasks]},
            fallback=geometric_mean([task.efficiency_index for task in completed_tasks]),
        )
        series.append(
            {
                "sprint": sprint.name,
                "planned": float(sprint.planned_story_points or 0),
                "completed": round_to(completed_points, 1),
                "sprintEi": round_to(sprint_ei, 3),
            }
        )
    return series


def choose_current_sprint(sprints: list[Sprint]) -> Sprint:
    def sprint_key(sprint: Sprint):
        return (
            sprint.end_date or date.min,
            sprint.start_date or date.min,
            sprint.id,
        )

    return sorted(sprints, key=sprint_key)[-1]


def build_problematic_tasks(current_sprint_tasks: list[ModeledTask]) -> list[dict]:
    def task_reason(task: ModeledTask) -> str:
        if task.status != "completed":
            return "Задача не завершена в рамках спринта и уже вышла за пределы планового времени."
        if task.on_time_probability < 0.55:
            return "По логнормальной модели вероятность уложиться в план ниже 55%."
        if task.deviation_percent > 30:
            return "Фактическое время отклонилось от плана больше чем на 30%."
        if task.efficiency_index < 0.85:
            return "Фактическое время заметно хуже теоретически оптимального времени модели."
        if task.communication_factor < 0.8:
            return "Состав задачи создаёт выраженные коммуникационные потери по закону Брукса."
        return "Задача требует дополнительного внимания по совокупности модельных факторов."

    def task_severity(task: ModeledTask) -> str:
        if (
            task.status != "completed"
            or task.on_time_probability < 0.45
            or task.deviation_percent > 40
            or task.efficiency_index < 0.75
        ):
            return "high"
        return "medium"

    problematic = []
    for task in current_sprint_tasks:
        if (
            task.status != "completed"
            or abs(task.deviation_percent) > 30
            or task.efficiency_index < 0.85
            or task.on_time_probability < 0.65
        ):
            problematic.append(
                {
                    **serialize_modeled_task(task),
                    "severity": task_severity(task),
                    "reason": task_reason(task),
                }
            )
    return sorted(
        problematic,
        key=lambda item: (0 if item["severity"] == "high" else 1, item["onTimeProbability"]),
    )


def build_probability_buckets(current_sprint_tasks: list[ModeledTask]) -> list[dict]:
    total = len(current_sprint_tasks) or 1
    buckets = [
        ("Высокая вероятность", lambda task: task.on_time_probability >= 0.8, "#10b981"),
        ("Умеренная вероятность", lambda task: 0.6 <= task.on_time_probability < 0.8, "#3b82f6"),
        ("Низкая вероятность", lambda task: task.on_time_probability < 0.6, "#f59e0b"),
    ]
    result = []
    for label, predicate, color in buckets:
        count = len([task for task in current_sprint_tasks if predicate(task)])
        result.append(
            {
                "label": label,
                "count": count,
                "percentage": round_to((count / total) * 100, 1),
                "color": color,
            }
        )
    return result


def build_member_stats(current_sprint_tasks: list[ModeledTask], project_members: list[ProjectMember]) -> list[dict]:
    known_members = {
        member.name: {
            "role": member.role,
            "qualification": member.qualification.value,
            "capacity": float(member.capacity_hours),
        }
        for member in project_members
    }
    inferred_qualifications: dict[str, list[str]] = {}
    for task in current_sprint_tasks:
        for participant in task.participants:
            inferred_qualifications.setdefault(participant.name, []).append(participant.qualification)

    members = []
    for name, qualifications in inferred_qualifications.items():
        qualification = known_members.get(name, {}).get("qualification") or Counter(qualifications).most_common(1)[0][0]
        role = known_members.get(name, {}).get("role") or role_label_from_qualification(qualification)
        capacity = known_members.get(name, {}).get("capacity") or default_capacity_by_qualification(qualification)
        member_tasks = [task for task in current_sprint_tasks if any(p.name == name for p in task.participants)]
        workload = sum(
            next((participant.hours for participant in task.participants if participant.name == name), 0)
            for task in member_tasks
        )
        utilization_percent = round_to((workload / capacity) * 100, 1) if capacity else 0
        weighted_efficiency = round_to(
            mean(
                [
                    task.efficiency_index
                    * (
                        1
                        + (
                            next((participant.hours for participant in task.participants if participant.name == name), 0)
                            / max(task.actual_hours, 1e-6)
                        )
                    )
                    for task in member_tasks
                ]
            ),
            3,
        )
        average_probability = round_to(mean([task.on_time_probability for task in member_tasks]) * 100, 1)
        status = (
            "overloaded"
            if utilization_percent > 100
            else "underutilized"
            if utilization_percent < 70
            else "optimal"
        )
        members.append(
            {
                "id": slugify(name),
                "name": name,
                "role": role,
                "qualification": qualification,
                "workload": round_to(workload, 1),
                "capacity": round_to(capacity, 1),
                "status": status,
                "utilizationPercent": utilization_percent,
                "weightedEfficiency": weighted_efficiency,
                "averageProbability": average_probability,
            }
        )
    return sorted(members, key=lambda item: item["name"])


def build_complexity_by_role(current_sprint_tasks: list[ModeledTask], member_stats: list[dict]) -> list[dict]:
    rows: dict[str, dict[str, float | str]] = {}
    member_names_by_role: dict[str, list[str]] = {}
    for member in member_stats:
        member_names_by_role.setdefault(member["role"], []).append(member["name"])
        rows.setdefault(member["role"], {"role": member["role"], "S": 0, "M": 0, "L": 0, "XL": 0})

    for role, names in member_names_by_role.items():
        for task in current_sprint_tasks:
            if any(participant.name in names for participant in task.participants):
                rows[role][task.complexity] += 1
    return list(rows.values())


def build_complexity_distribution(modeled_tasks: list[ModeledTask]) -> list[dict]:
    meta = {
        "S": {"name": "S / простые", "color": "#10b981"},
        "M": {"name": "M / средние", "color": "#3b82f6"},
        "L": {"name": "L / сложные", "color": "#f59e0b"},
        "XL": {"name": "XL / критические", "color": "#ef4444"},
    }
    total = len(modeled_tasks) or 1
    distribution = []
    for code in ["S", "M", "L", "XL"]:
        count = len([task for task in modeled_tasks if task.complexity == code])
        distribution.append(
            {
                "code": code,
                "name": meta[code]["name"],
                "value": round_to((count / total) * 100, 1),
                "color": meta[code]["color"],
            }
        )
    return distribution


def build_recommendations(
    modeled_tasks: list[ModeledTask],
    sprints: list[Sprint],
    current_sprint: Sprint,
    current_sprint_tasks: list[ModeledTask],
    current_carryover_tasks: list[ModeledTask],
    current_completed_tasks: list[ModeledTask],
    backlog_completion_index: float,
    sprint_efficiency_index: float,
    member_stats: list[dict],
    beta: float,
    work_norms: dict[str, float],
) -> list[dict]:
    sprint_series = build_sprint_series(current_sprint_tasks + [task for task in modeled_tasks if task.sprint_id != current_sprint.id], sprints, DEFAULT_FORMULAS)
    overloaded_members = [member for member in member_stats if member["status"] == "overloaded"]
    underutilized_members = [member for member in member_stats if member["status"] == "underutilized"]
    junior_risk_tasks = [
        task for task in current_sprint_tasks if task.has_junior_contributor and task.complexity in {"L", "XL"}
    ]
    communication_risk_tasks = [
        task for task in current_sprint_tasks if task.participant_count >= 4 and task.communication_factor < 0.8
    ]
    most_problematic_complexity = max(
        [
            {
                "code": code,
                "averageDeviation": mean(
                    [task.deviation_percent for task in modeled_tasks if task.complexity == code and task.status == "completed"]
                ),
                "averageEi": mean(
                    [task.efficiency_index for task in modeled_tasks if task.complexity == code and task.status == "completed"]
                ),
            }
            for code in ["S", "M", "L", "XL"]
        ],
        key=lambda item: item["averageDeviation"],
        default={"code": "M", "averageDeviation": 0.0, "averageEi": 1.0},
    )
    return [
        {
            "id": "scope-balance",
            "priority": "high" if backlog_completion_index < 85 else "medium",
            "kind": "scope",
            "title": "Сбалансировать объём следующего спринта относительно расчетной velocity",
            "description": (
                "План текущего спринта оказался выше фактической пропускной способности команды."
                if backlog_completion_index < 85
                else "Планирование близко к рабочему диапазону, но требует небольшого буфера на риск."
            ),
            "reason": (
                f"BCI текущего спринта = {backlog_completion_index}%, "
                f"а средняя velocity по истории = {round_to(mean([item['completed'] for item in sprint_series]), 1)} SP."
            ),
            "metrics": [
                f"BCI: {backlog_completion_index}%",
                f"Средняя velocity: {round_to(mean([item['completed'] for item in sprint_series]), 1)} SP",
                f"Текущий план: {float(current_sprint.planned_story_points or 0)} SP",
            ],
        },
        {
            "id": "workload-redistribution",
            "priority": "high" if overloaded_members else "low",
            "kind": "team",
            "title": "Перераспределить часы между перегруженными и недогруженными участниками",
            "description": (
                "В текущем спринте есть участники, работающие сверх своей доступной ёмкости."
                if overloaded_members
                else "Нагрузка распределена достаточно ровно, но мониторинг стоит сохранить."
            ),
            "reason": (
                f"Перегружены: {', '.join(member['name'] for member in overloaded_members)}. "
                f"Недогружены: {', '.join(member['name'] for member in underutilized_members) or 'нет'}."
                if overloaded_members
                else "Критических перегрузок по текущему набору задач модель не обнаружила."
            ),
            "metrics": [
                f"Перегружено участников: {len(overloaded_members)}",
                f"Средняя утилизация: {round_to(mean([member['utilizationPercent'] for member in member_stats]), 1)}%",
                f"Недогружено участников: {len(underutilized_members)}",
            ],
        },
        {
            "id": "junior-pairing",
            "priority": "high" if junior_risk_tasks else "medium",
            "kind": "risk",
            "title": "Сложные задачи с junior-участием переводить в парное исполнение",
            "description": (
                "Модель показывает, что junior-участники на L/XL-задачах повышают риск выхода за план."
                if junior_risk_tasks
                else "Junior-участие в сложных задачах сейчас не доминирует, но правило pairing полезно сохранить."
            ),
            "reason": (
                f"В текущем спринте {len(junior_risk_tasks)} задач класса L/XL содержат junior-вклад. "
                f"Средняя вероятность уложиться в срок по ним = {round_to(mean([task.on_time_probability for task in junior_risk_tasks]) * 100, 1)}%."
                if junior_risk_tasks
                else "Сложные задачи преимущественно закрываются middle/senior составом."
            ),
            "metrics": [
                f"Задач L/XL с junior: {len(junior_risk_tasks)}",
                f"Средний EI по ним: {round_to(mean([task.efficiency_index for task in junior_risk_tasks]), 2)}",
                f"Средний P(Tfact ≤ Tplan): {round_to(mean([task.on_time_probability for task in junior_risk_tasks]) * 100, 1)}%",
            ],
        },
        {
            "id": "complexity-calibration",
            "priority": "medium" if most_problematic_complexity["averageDeviation"] > 20 else "low",
            "kind": "calibration",
            "title": f"Перекалибровать норматив w_{most_problematic_complexity['code']} для класса {most_problematic_complexity['code']}",
            "description": "Наиболее нестабильный класс задач даёт самый большой разрыв между планом и фактом.",
            "reason": (
                f"Для класса {most_problematic_complexity['code']} среднее отклонение = "
                f"{round_to(most_problematic_complexity['averageDeviation'], 1)}%, "
                f"а средний EI = {round_to(most_problematic_complexity['averageEi'], 2)}."
            ),
            "metrics": [
                f"w_{most_problematic_complexity['code']}: {work_norms[most_problematic_complexity['code']]} ч/SP",
                f"Среднее отклонение: {round_to(most_problematic_complexity['averageDeviation'], 1)}%",
                f"Средний EI: {round_to(most_problematic_complexity['averageEi'], 2)}",
            ],
        },
        {
            "id": "communication-losses",
            "priority": "medium" if communication_risk_tasks else "low",
            "kind": "quality",
            "title": "Снижать количество участников на задачах с высоким коммуникационным штрафом",
            "description": (
                "Часть задач теряет эффективность из-за большого количества участников."
                if communication_risk_tasks
                else "Сильных коммуникационных штрафов в текущем спринте почти нет."
            ),
            "reason": (
                f"Найдено {len(communication_risk_tasks)} задач с 4+ участниками и f(M) < 0,8."
                if communication_risk_tasks
                else f"Оцененный коэффициент Брукса β = {beta}."
            ),
            "metrics": [
                f"β: {beta}",
                f"Задач с f(M) < 0,8: {len(communication_risk_tasks)}",
                f"Средний f(M): {round_to(mean([task.communication_factor for task in current_sprint_tasks]), 2)}",
            ],
        },
    ]


def serialize_modeled_task(task: ModeledTask) -> dict:
    return {
        "id": task.id,
        "title": task.title,
        "sprintId": task.sprint_id,
        "sprintName": task.sprint_name,
        "storyPoints": task.story_points,
        "complexity": task.complexity,
        "plannedHours": task.planned_hours,
        "actualHours": task.actual_hours,
        "status": task.status,
        "participantCount": task.participant_count,
        "weightedQualification": task.weighted_qualification,
        "communicationFactor": task.communication_factor,
        "optimalHours": task.optimal_hours,
        "efficiencyIndex": task.efficiency_index,
        "deviationPercent": task.deviation_percent,
        "onTimeProbability": task.on_time_probability,
        "area": task.area,
        "participants": [
            {
                "name": participant.name,
                "role": participant.role,
                "qualification": participant.qualification,
                "hours": participant.hours,
                "alpha": participant.alpha,
            }
            for participant in task.participants
        ],
        "hasJuniorContributor": task.has_junior_contributor,
        "externalDependency": task.external_dependency,
    }


def format_sprint_date_label(start: date | None, end: date | None) -> str:
    if start is None or end is None:
        return "Даты спринта не заданы"
    return f"{start.strftime('%d.%m.%Y')} - {end.strftime('%d.%m.%Y')}"


def duration_days(start: date | None, end: date | None) -> int:
    if start is None or end is None:
        return 0
    return (end - start).days + 1


def role_label_from_qualification(qualification: str) -> str:
    return {
        "junior": "Junior developer",
        "middle": "Developer",
        "senior": "Senior developer",
        "analyst": "System analyst",
        "pm": "Project manager",
    }[qualification]


def default_capacity_by_qualification(qualification: str) -> float:
    return {
        "junior": 36.0,
        "middle": 40.0,
        "senior": 40.0,
        "analyst": 38.0,
        "pm": 30.0,
    }[qualification]


def slugify(value: str) -> str:
    return (
        value.lower()
        .replace(" ", "-")
        .replace(".", "")
        .replace(",", "")
        .replace("ё", "е")
    )
