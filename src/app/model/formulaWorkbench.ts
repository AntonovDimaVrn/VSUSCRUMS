import type { BackendModelConfigVersion, BackendTaskDetails } from "../api/backend";

type DetailedTask = BackendTaskDetails["tasks"][number];

export type FormulaKey = keyof BackendModelConfigVersion["formulas"];

export type FormulaVariableDefinition = {
  token: string;
  label: string;
  description: string;
  scope: "task" | "sprint" | "shared";
};

export type FormulaDefinition = {
  key: FormulaKey;
  label: string;
  symbol: string;
  description: string;
  scope: "task" | "sprint";
  helperText: string;
  variableTokens: string[];
};

export const formulaDefinitions: Record<FormulaKey, FormulaDefinition> = {
  weighted_qualification: {
    key: "weighted_qualification",
    label: "Взвешенная квалификация",
    symbol: "Q_i",
    description: "Показывает квалификационный потенциал команды задачи с учётом часов участия.",
    scope: "task",
    helperText: "Чаще всего меняют веса или логику нормализации по суммарным часам.",
    variableTokens: ["weighted_alpha_hours", "total_participant_hours"],
  },
  communication_factor: {
    key: "communication_factor",
    label: "Коммуникационный множитель",
    symbol: "f(M_i)",
    description: "Снижает эффективность при росте количества участников по закону Брукса.",
    scope: "task",
    helperText: "Обычно здесь управляют жёсткостью штрафа через beta и нижнюю границу.",
    variableTokens: ["beta", "participant_count"],
  },
  optimal_time: {
    key: "optimal_time",
    label: "Теоретически оптимальное время",
    symbol: "Topt_i",
    description: "Ожидаемое модельное время задачи с учётом SP, сложности, квалификации и коммуникаций.",
    scope: "task",
    helperText: "Это центральная формула модели: любые правки здесь сильнее всего влияют на EI_i.",
    variableTokens: ["work_norm", "story_points", "weighted_qualification", "communication_factor"],
  },
  efficiency_index: {
    key: "efficiency_index",
    label: "Индекс эффективности задачи",
    symbol: "EI_i",
    description: "Сравнивает фактическое время задачи с теоретически оптимальным временем.",
    scope: "task",
    helperText: "Если хочешь усилить штраф за затяжные задачи, начинай изменения отсюда.",
    variableTokens: ["optimal_time", "actual_hours"],
  },
  deviation_percent: {
    key: "deviation_percent",
    label: "Отклонение от плана",
    symbol: "δ_i",
    description: "Процентное отклонение фактического времени от планового.",
    scope: "task",
    helperText: "Формула обычно остаётся простой, но можно вводить дополнительные пороги или нормализацию.",
    variableTokens: ["actual_hours", "planned_hours"],
  },
  on_time_probability: {
    key: "on_time_probability",
    label: "Вероятность выполнить в срок",
    symbol: "P(Tfact ≤ Tplan)",
    description: "Оценивает вероятность успеть по логнормальной модели времени выполнения.",
    scope: "task",
    helperText: "Здесь чаще всего меняют вид вероятностной функции или параметры распределения.",
    variableTokens: ["ln_planned_hours", "mu", "sigma"],
  },
  backlog_completion_index: {
    key: "backlog_completion_index",
    label: "Индекс выполнения бэклога",
    symbol: "BCI_sprint",
    description: "Показывает, насколько реалистично спланирован объём спринта.",
    scope: "sprint",
    helperText: "Preview для этой формулы собирается по задачам спринта выбранной задачи.",
    variableTokens: ["completed_story_points", "planned_story_points"],
  },
  sprint_efficiency_index: {
    key: "sprint_efficiency_index",
    label: "Эффективность спринта",
    symbol: "EI_sprint",
    description: "Геометрическое среднее индексов эффективности завершённых задач спринта.",
    scope: "sprint",
    helperText: "Preview для этой формулы использует все завершённые задачи того же спринта.",
    variableTokens: ["task_efficiency_indexes"],
  },
};

export const formulaVariableDefinitions: Record<string, FormulaVariableDefinition> = {
  actual_hours: {
    token: "actual_hours",
    label: "Фактические часы",
    description: "Tfact_i. Сколько часов задача реально заняла по данным Excel.",
    scope: "task",
  },
  beta: {
    token: "beta",
    label: "Коэффициент Брукса",
    description: "Параметр коммуникационных потерь. Чем выше, тем сильнее штраф за большую команду.",
    scope: "shared",
  },
  communication_factor: {
    token: "communication_factor",
    label: "Коммуникационный множитель",
    description: "Результат текущей формулы f(M_i) для выбранной задачи.",
    scope: "task",
  },
  completed_story_points: {
    token: "completed_story_points",
    label: "Завершённые SP спринта",
    description: "Сумма Story Points завершённых задач внутри спринта выбранной задачи.",
    scope: "sprint",
  },
  ln_planned_hours: {
    token: "ln_planned_hours",
    label: "Логарифм плановых часов",
    description: "Натуральный логарифм от planned_hours. Используется в логнормальной модели.",
    scope: "task",
  },
  mu: {
    token: "mu",
    label: "mu распределения",
    description: "Параметр среднего для ln(Tfact) в логнормальной модели по классу сложности задачи.",
    scope: "task",
  },
  optimal_time: {
    token: "optimal_time",
    label: "Теоретически оптимальное время",
    description: "Результат текущей формулы Topt_i для выбранной задачи.",
    scope: "task",
  },
  participant_count: {
    token: "participant_count",
    label: "Количество участников",
    description: "M_i. Сколько человек участвует в задаче.",
    scope: "task",
  },
  planned_hours: {
    token: "planned_hours",
    label: "Плановые часы",
    description: "Tplan_i. Плановое время выполнения задачи из Excel.",
    scope: "task",
  },
  planned_story_points: {
    token: "planned_story_points",
    label: "Запланированные SP спринта",
    description: "Сумма Story Points всех задач спринта выбранной задачи.",
    scope: "sprint",
  },
  sigma: {
    token: "sigma",
    label: "sigma распределения",
    description: "Стандартное отклонение для ln(Tfact) в логнормальной модели по классу сложности.",
    scope: "task",
  },
  story_points: {
    token: "story_points",
    label: "Story Points",
    description: "SP_i. Оценка сложности задачи в Story Points.",
    scope: "task",
  },
  task_efficiency_indexes: {
    token: "task_efficiency_indexes",
    label: "Массив EI задач спринта",
    description: "Список EI_i завершённых задач того же спринта. Используется для EI_sprint.",
    scope: "sprint",
  },
  total_participant_hours: {
    token: "total_participant_hours",
    label: "Суммарные часы участников",
    description: "Σ n_ij. Общий объём часов всех участников выбранной задачи.",
    scope: "task",
  },
  weighted_alpha_hours: {
    token: "weighted_alpha_hours",
    label: "Взвешенные alpha-часы",
    description: "Σ n_ij * α(q_j). Сумма часов участников с поправкой на квалификацию.",
    scope: "task",
  },
  weighted_qualification: {
    token: "weighted_qualification",
    label: "Взвешенная квалификация",
    description: "Результат текущей формулы Q_i для выбранной задачи.",
    scope: "task",
  },
  work_norm: {
    token: "work_norm",
    label: "Норматив трудоёмкости",
    description: "w_ci. Норматив часов на один Story Point для текущего класса сложности.",
    scope: "task",
  },
};

export const formulaOperatorTokens = [
  { label: "+", value: " + " },
  { label: "-", value: " - " },
  { label: "*", value: " * " },
  { label: "/", value: " / " },
  { label: "^", value: " ** " },
  { label: "(", value: "(" },
  { label: ")", value: ")" },
  { label: ",", value: ", " },
] as const;

export const formulaFunctionTokens = [
  { label: "abs()", value: "abs()", cursorOffset: -1 },
  { label: "exp()", value: "exp()", cursorOffset: -1 },
  { label: "geometric_mean()", value: "geometric_mean()", cursorOffset: -1 },
  { label: "ln()", value: "ln()", cursorOffset: -1 },
  { label: "max()", value: "max()", cursorOffset: -1 },
  { label: "min()", value: "min()", cursorOffset: -1 },
  { label: "phi()", value: "phi()", cursorOffset: -1 },
  { label: "round()", value: "round()", cursorOffset: -1 },
  { label: "sqrt()", value: "sqrt()", cursorOffset: -1 },
] as const;

const allowedFunctionNames = new Set(
  formulaFunctionTokens.map((token) => token.value.replace("()", "")),
);

function erf(value: number) {
  const sign = value < 0 ? -1 : 1;
  const absolute = Math.abs(value);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * absolute);
  const y =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absolute * absolute));
  return sign * y;
}

function normalCdf(value: number) {
  return 0.5 * (1 + erf(value / Math.sqrt(2)));
}

function geometricMean(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  const safeValues = values.map((value) => Math.max(value, 1e-6));
  const logSum = safeValues.reduce((sum, value) => sum + Math.log(value), 0);
  return Math.exp(logSum / safeValues.length);
}

export function evaluateFormulaPreview(
  expression: string,
  context: Record<string, number | number[]>,
) {
  const helpers = {
    abs: Math.abs,
    exp: Math.exp,
    geometric_mean: geometricMean,
    ln: Math.log,
    log: Math.log,
    max: Math.max,
    min: Math.min,
    phi: normalCdf,
    round: (value: number, digits = 0) => {
      const factor = 10 ** digits;
      return Math.round(value * factor) / factor;
    },
    sqrt: Math.sqrt,
  };

  const scope = { ...helpers, ...context };
  const keys = Object.keys(scope);
  const values = Object.values(scope);

  try {
    const previewFunction = new Function(...keys, `"use strict"; return (${expression});`);
    const result = previewFunction(...values);
    if (typeof result !== "number" || Number.isNaN(result) || !Number.isFinite(result)) {
      throw new Error("Формула вернула нечисловой результат.");
    }
    return { result, error: "" };
  } catch (error) {
    return {
      result: null,
      error: error instanceof Error ? error.message : "Не удалось вычислить превью формулы.",
    };
  }
}

export function buildFormulaPreviewContext(
  task: DetailedTask | null,
  tasks: DetailedTask[],
): Record<string, number | number[]> | null {
  if (!task) {
    return null;
  }

  const sprintTasks = tasks.filter((candidate) => candidate.sprintName === task.sprintName);
  const completedSprintTasks = sprintTasks.filter((candidate) => candidate.status === "completed");
  const plannedStoryPoints = sprintTasks.reduce((sum, candidate) => sum + candidate.storyPoints, 0);
  const completedStoryPoints = completedSprintTasks.reduce(
    (sum, candidate) => sum + candidate.storyPoints,
    0,
  );

  return {
    actual_hours: task.modelDetails.inputs.actualHours,
    beta: task.modelDetails.inputs.beta,
    communication_factor: task.modelDetails.outputs.communicationFactor,
    completed_story_points: completedStoryPoints,
    ln_planned_hours: Math.log(Math.max(task.modelDetails.inputs.plannedHours, 1e-6)),
    mu: task.modelDetails.inputs.logNormalMu,
    optimal_time: task.modelDetails.outputs.optimalHours,
    participant_count: task.modelDetails.inputs.participantCount,
    planned_hours: task.modelDetails.inputs.plannedHours,
    planned_story_points: plannedStoryPoints,
    sigma: Math.max(task.modelDetails.inputs.logNormalSigma, 0.05),
    story_points: task.modelDetails.inputs.storyPoints,
    task_efficiency_indexes: completedSprintTasks.length
      ? completedSprintTasks.map((candidate) => candidate.efficiencyIndex)
      : [task.efficiencyIndex],
    total_participant_hours: task.modelDetails.inputs.totalParticipantHours,
    weighted_alpha_hours: task.modelDetails.inputs.weightedAlphaHours,
    weighted_qualification: task.modelDetails.outputs.weightedQualification,
    work_norm: task.modelDetails.inputs.workNorm,
  };
}

function extractIdentifierTokens(expression: string) {
  const matches = expression.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) ?? [];
  return Array.from(new Set(matches));
}

export function getReferencedVariableTokens(expression: string) {
  return extractIdentifierTokens(expression).filter((token) => token in formulaVariableDefinitions);
}

export function getUnknownFormulaTokens(expression: string) {
  return extractIdentifierTokens(expression).filter(
    (token) => !(token in formulaVariableDefinitions) && !allowedFunctionNames.has(token),
  );
}

export function formatPreviewValue(value: number | number[]) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => roundValue(item)).join(", ")}]`;
  }
  return String(roundValue(value));
}

function roundValue(value: number) {
  return Math.round(value * 1000) / 1000;
}
