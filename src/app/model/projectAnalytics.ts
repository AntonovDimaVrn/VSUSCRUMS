export type ComplexityClass = "S" | "M" | "L" | "XL";
export type Qualification = "junior" | "middle" | "senior";
export type TaskStatus = "completed" | "in_progress" | "blocked";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  qualification: Qualification;
  capacityHours: number;
};

type TaskAssignment = {
  memberId: string;
  hours: number;
};

type Sprint = {
  id: string;
  name: string;
  start: string;
  end: string;
  plannedStoryPoints: number;
};

type Task = {
  id: string;
  title: string;
  sprintId: string;
  storyPoints: number;
  complexity: ComplexityClass;
  plannedHours: number;
  actualHours: number;
  status: TaskStatus;
  area: string;
  externalDependency?: boolean;
  assignments: TaskAssignment[];
};

export type ModeledTask = {
  id: string;
  title: string;
  sprintId: string;
  sprintName: string;
  sprintStart?: string;
  sprintEnd?: string;
  storyPoints: number;
  complexity: ComplexityClass;
  plannedHours: number;
  actualHours: number;
  status: TaskStatus;
  participantCount: number;
  weightedQualification: number;
  communicationFactor: number;
  optimalHours: number;
  efficiencyIndex: number;
  deviationPercent: number;
  onTimeProbability: number;
  area: string;
  participants: Array<{
    name: string;
    role: string;
    qualification: Qualification;
    hours: number;
    alpha: number;
  }>;
  hasJuniorContributor: boolean;
  externalDependency: boolean;
};

export type Recommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  kind: "scope" | "team" | "risk" | "calibration" | "quality";
  title: string;
  description: string;
  reason: string;
  metrics: string[];
};

export type ProjectAnalytics = {
  alphaScale: Record<Qualification, number>;
  beta: number;
  workNorms: Record<ComplexityClass, number>;
  logNormalParams: Record<ComplexityClass, { mu: number; sigma: number }>;
  regression: {
    intercept: number;
    sp: number;
    qualification: number;
    participants: number;
  };
  dashboard: {
    averageVelocity: number;
    estimateAccuracy: number;
    currentBacklogCompletion: number;
    riskScore: number;
    riskLabel: string;
    inputFile?: string;
    period?: string;
    sprintCount?: number;
    requestCount?: number;
    assignmentRows?: number;
    teamMemberCount?: number;
    consultations?: number;
    errors?: number;
    improvements?: number;
    plannedHours?: number;
    actualHours?: number;
    deviationHours?: number;
    deviationPercent?: number;
    optimalHours?: number;
    optimalDeviationPercent?: number;
    onTimeProbability?: number;
    sprintSeries: Array<{
      sprint: string;
      planned: number;
      completed: number;
      sprintEi: number;
    }>;
    complexityDistribution: Array<{
      code: ComplexityClass;
      name: string;
      value: number;
      color: string;
    }>;
    modelSummary: Array<{
      label: string;
      value: string;
      note: string;
    }>;
  };
  sprint: {
    sprintName: string;
    dateLabel: string;
    durationDays: number;
    plannedStoryPoints: number;
    completedStoryPoints: number;
    backlogCompletionIndex: number;
    sprintEfficiencyIndex: number;
    averageTaskProbability: number;
    riskyTaskCount: number;
    carryoverTasks: ModeledTask[];
    problematicTasks: Array<
      ModeledTask & {
        severity: "high" | "medium";
        reason: string;
      }
    >;
    probabilityBuckets: Array<{
      label: string;
      count: number;
      percentage: number;
      color: string;
    }>;
  };
  team: {
    totalMembers: number;
    overloadedCount: number;
    averageUtilization: number;
    members: Array<{
      id: string;
      name: string;
      role: string;
      qualification: Qualification;
      workload: number;
      capacity: number;
      status: "optimal" | "overloaded" | "underutilized";
      utilizationPercent: number;
      weightedEfficiency: number;
      averageProbability: number;
    }>;
    loadDistribution: Array<{
      name: string;
      workload: number;
      capacity: number;
    }>;
    complexityByRole: Array<{
      role: string;
      S: number;
      M: number;
      L: number;
      XL: number;
    }>;
  };
  recommendations: Recommendation[];
  taskDetails?: ModeledTask[];
  formulas?: Record<string, string>;
  previewRows: Array<{
    id: string;
    sprint: string;
    storyPoints: number;
    complexity: ComplexityClass;
    participants: number;
    plannedHours: number;
    actualHours: number;
  }>;
  uploadFields: string[];
};

const alphaScale: Record<Qualification, number> = {
  junior: 0.6,
  middle: 1.0,
  senior: 1.4,
};

const qualificationLabel: Record<Qualification, string> = {
  junior: "младший специалист",
  middle: "основной специалист",
  senior: "ведущий специалист",
};

const complexityMeta: Record<ComplexityClass, { name: string; color: string }> = {
  S: { name: "S / консультации", color: "#10b981" },
  M: { name: "M / ошибки", color: "#3b82f6" },
  L: { name: "L / доработки", color: "#f59e0b" },
  XL: { name: "XL / критические доработки", color: "#ef4444" },
};

const members: TeamMember[] = [
  { id: "smirnova", name: "Анна Смирнова", role: "руководитель проекта", qualification: "senior", capacityHours: 40 },
  { id: "ivanov", name: "Иван Иванов", role: "разработчик", qualification: "senior", capacityHours: 40 },
  { id: "kovalenko", name: "Алексей Коваленко", role: "разработчик", qualification: "middle", capacityHours: 40 },
  { id: "petrov", name: "Михаил Петров", role: "разработчик", qualification: "junior", capacityHours: 36 },
  { id: "sidorova", name: "Елена Сидорова", role: "аналитик", qualification: "middle", capacityHours: 38 },
  { id: "orlov", name: "Павел Орлов", role: "руководитель проекта", qualification: "middle", capacityHours: 30 },
];

const sprintStarts = [
  "2026-01-12",
  "2026-01-19",
  "2026-01-26",
  "2026-02-02",
  "2026-02-09",
  "2026-02-16",
  "2026-02-23",
  "2026-03-02",
  "2026-03-09",
  "2026-03-16",
  "2026-03-23",
  "2026-03-30",
  "2026-04-06",
  "2026-04-13",
  "2026-04-20",
  "2026-04-27",
  "2026-05-04",
  "2026-05-11",
  "2026-05-18",
  "2026-05-25",
];

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const sprints: Sprint[] = sprintStarts.map((start, index) => ({
  id: `s${index + 1}`,
  name: `Спринт ${index + 1}`,
  start,
  end: index === 19 ? "2026-05-29" : addDays(start, 4),
  plannedStoryPoints: 10,
}));

const requestTypeSequence: Array<{ area: string; complexity: ComplexityClass; storyPoints: number; title: string }> = [
  ...Array.from({ length: 40 }, (_, index) => ({
    area: "Консультация",
    complexity: "S" as const,
    storyPoints: index % 3 === 0 ? 2 : 1,
    title: "Консультация пользователя по работе сервиса",
  })),
  ...Array.from({ length: 100 }, (_, index) => ({
    area: "Ошибка",
    complexity: (index % 5 === 0 ? "L" : "M") as ComplexityClass,
    storyPoints: index % 4 === 0 ? 5 : 3,
    title: "Исправление ошибки в заявке пользователя",
  })),
  ...Array.from({ length: 60 }, (_, index) => ({
    area: "Доработка",
    complexity: (index % 4 === 0 ? "XL" : "L") as ComplexityClass,
    storyPoints: index % 4 === 0 ? 8 : 5,
    title: "Доработка функциональности по заявке",
  })),
];

function plannedHoursFor(index: number, request: { area: string; complexity: ComplexityClass }) {
  const base = request.area === "Консультация" ? 18 : request.area === "Ошибка" ? 39.5 : 48.5;
  const oscillation = [0, 1.7, -1.2, 2.4, -0.8][index % 5];
  const complexityBoost = request.complexity === "XL" ? 7.5 : request.complexity === "L" ? 3.2 : 0;
  return Number((base + oscillation + complexityBoost).toFixed(1));
}

function actualHoursFor(index: number, plannedHours: number) {
  const multiplier = [1.03, 1.06, 1.09, 1.12, 1.15, 1.18][index % 6];
  const correction = index % 17 === 0 ? 6.8 : index % 13 === 0 ? -2.1 : 0;
  return Number((plannedHours * multiplier + correction).toFixed(1));
}

function buildAssignments(taskIndex: number, actualHours: number): TaskAssignment[] {
  const participantCount = taskIndex < 109 ? 3 : 2;
  const primary = taskIndex % members.length;
  const assignments = Array.from({ length: participantCount }, (_, offset) => {
    const member = members[(primary + offset) % members.length];
    const rawShare = offset === 0 ? 0.52 : participantCount === 3 && offset === 1 ? 0.3 : 0.18;
    return {
      memberId: member.id,
      hours: Number((actualHours * rawShare).toFixed(1)),
    };
  });
  const delta = Number((actualHours - assignments.reduce((sum, assignment) => sum + assignment.hours, 0)).toFixed(1));
  assignments[0] = { ...assignments[0], hours: Number((assignments[0].hours + delta).toFixed(1)) };
  return assignments;
}

const tasks: Task[] = requestTypeSequence.map((request, index) => {
  const sprintIndex = Math.floor(index / 10);
  const plannedHours = plannedHoursFor(index, request);
  const actualHours = actualHoursFor(index, plannedHours);
  const status: TaskStatus = index >= 195 ? (index % 2 === 0 ? "in_progress" : "blocked") : "completed";
  return {
    id: `SCRUMS-${String(index + 1).padStart(3, "0")}`,
    title: `${request.title} №${index + 1}`,
    sprintId: sprints[sprintIndex].id,
    storyPoints: request.storyPoints,
    complexity: request.complexity,
    plannedHours,
    actualHours,
    status,
    area: request.area,
    externalDependency: index % 19 === 0,
    assignments: buildAssignments(index, actualHours),
  };
});

const actualDatasetSummary = {
  filename: "SCRUMS input Jan-Jun 2026.xlsx",
  period: "12.01.2026-29.05.2026",
  sprintCount: 20,
  requestCount: 200,
  assignmentRows: 509,
  teamMembers: 6,
  consultations: 40,
  errors: 100,
  improvements: 60,
  plannedHours: 8096.7,
  actualHours: 8847.6,
  overrunHours: 750.9,
  overrunPercent: 9.3,
};

function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function mean(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function geometricMean(values: number[]) {
  if (values.length === 0) return 0;
  const safeValues = values.filter((value) => value > 0);
  if (safeValues.length === 0) return 0;
  return Math.exp(mean(safeValues.map((value) => Math.log(value))));
}

function erf(x: number) {
  const sign = x >= 0 ? 1 : -1;
  const absolute = Math.abs(x);
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

function transpose(matrix: number[][]) {
  return matrix[0].map((_, columnIndex) => matrix.map((row) => row[columnIndex]));
}

function multiplyMatrices(left: number[][], right: number[][]) {
  return left.map((row) =>
    right[0].map((_, columnIndex) =>
      row.reduce((sum, value, valueIndex) => sum + value * right[valueIndex][columnIndex], 0),
    ),
  );
}

function multiplyMatrixVector(matrix: number[][], vector: number[]) {
  return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}

function invertMatrix(matrix: number[][]) {
  const size = matrix.length;
  const augmented = matrix.map((row, rowIndex) => [
    ...row.map((value, columnIndex) => value + (rowIndex === columnIndex ? 1e-6 : 0)),
    ...Array.from({ length: size }, (_, columnIndex) => (rowIndex === columnIndex ? 1 : 0)),
  ]);

  for (let pivot = 0; pivot < size; pivot += 1) {
    let maxRow = pivot;
    for (let row = pivot + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[maxRow][pivot])) {
        maxRow = row;
      }
    }

    if (maxRow !== pivot) {
      [augmented[pivot], augmented[maxRow]] = [augmented[maxRow], augmented[pivot]];
    }

    const pivotValue = augmented[pivot][pivot];
    if (Math.abs(pivotValue) < 1e-10) {
      return null;
    }

    for (let column = 0; column < size * 2; column += 1) {
      augmented[pivot][column] /= pivotValue;
    }

    for (let row = 0; row < size; row += 1) {
      if (row === pivot) continue;
      const factor = augmented[row][pivot];
      for (let column = 0; column < size * 2; column += 1) {
        augmented[row][column] -= factor * augmented[pivot][column];
      }
    }
  }

  return augmented.map((row) => row.slice(size));
}

function solveRegressionCoefficients(features: number[][], target: number[]) {
  if (features.length === 0) {
    return [0, 0, 0, 0];
  }

  const xTranspose = transpose(features);
  const xtx = multiplyMatrices(xTranspose, features);
  const xtxInverse = invertMatrix(xtx);
  if (!xtxInverse) {
    return [0, 0, 0, 0];
  }

  const xty = multiplyMatrixVector(xTranspose, target);
  return multiplyMatrixVector(xtxInverse, xty);
}

const membersById = Object.fromEntries(members.map((member) => [member.id, member]));
const sprintById = Object.fromEntries(sprints.map((sprint) => [sprint.id, sprint]));

function getWeightedQualification(task: Task) {
  const totalHours = task.assignments.reduce((sum, assignment) => sum + assignment.hours, 0);
  if (totalHours === 0) return 1;

  const weightedHours = task.assignments.reduce((sum, assignment) => {
    const member = membersById[assignment.memberId];
    return sum + assignment.hours * alphaScale[member.qualification];
  }, 0);

  return weightedHours / totalHours;
}

function getCommunicationFactor(participants: number, beta: number) {
  if (participants <= 1) return 1;
  return Math.max(0.45, 1 - beta * ((participants - 1) / participants));
}

function deriveWorkNorms(beta: number) {
  const normsByComplexity = {
    S: [] as number[],
    M: [] as number[],
    L: [] as number[],
    XL: [] as number[],
  };

  tasks
    .filter((task) => task.status === "completed")
    .forEach((task) => {
      const weightedQualification = getWeightedQualification(task);
      const communicationFactor = getCommunicationFactor(task.assignments.length, beta);
      const norm = (task.actualHours * weightedQualification * communicationFactor) / task.storyPoints;
      normsByComplexity[task.complexity].push(norm);
    });

  return {
    S: roundTo(median(normsByComplexity.S), 3),
    M: roundTo(median(normsByComplexity.M), 3),
    L: roundTo(median(normsByComplexity.L), 3),
    XL: roundTo(median(normsByComplexity.XL), 3),
  };
}

function deriveBeta() {
  let bestBeta = 0.28;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let beta = 0.05; beta <= 0.6; beta += 0.01) {
    const norms = deriveWorkNorms(beta);
    const score = mean(
      tasks
        .filter((task) => task.status === "completed")
        .map((task) => {
          const weightedQualification = getWeightedQualification(task);
          const communicationFactor = getCommunicationFactor(task.assignments.length, beta);
          const modeledHours =
            (norms[task.complexity] * task.storyPoints) /
            (weightedQualification * communicationFactor);
          return Math.abs(Math.log(modeledHours / task.actualHours));
        }),
    );

    if (score < bestScore) {
      bestScore = score;
      bestBeta = beta;
    }
  }

  return roundTo(bestBeta, 2);
}

function deriveLogNormalParams() {
  const grouped = {
    S: [] as number[],
    M: [] as number[],
    L: [] as number[],
    XL: [] as number[],
  };

  const completedTasks = tasks.filter((task) => task.status === "completed");
  completedTasks.forEach((task) => {
    grouped[task.complexity].push(Math.log(task.actualHours));
  });

  const allLogValues = completedTasks.map((task) => Math.log(task.actualHours));
  const fallbackMu = mean(allLogValues);
  const fallbackSigma = Math.sqrt(mean(allLogValues.map((value) => (value - fallbackMu) ** 2)));

  return {
    S: buildLogParams(grouped.S, fallbackMu, fallbackSigma),
    M: buildLogParams(grouped.M, fallbackMu, fallbackSigma),
    L: buildLogParams(grouped.L, fallbackMu, fallbackSigma),
    XL: buildLogParams(grouped.XL, fallbackMu, fallbackSigma),
  };
}

function buildLogParams(values: number[], fallbackMu: number, fallbackSigma: number) {
  if (values.length < 2) {
    return { mu: roundTo(fallbackMu, 3), sigma: roundTo(Math.max(fallbackSigma, 0.05), 3) };
  }
  const mu = mean(values);
  const sigma = Math.sqrt(mean(values.map((value) => (value - mu) ** 2)));
  return { mu: roundTo(mu, 3), sigma: roundTo(Math.max(sigma, 0.05), 3) };
}

const beta = deriveBeta();
const workNorms = deriveWorkNorms(beta);
const logNormalParams = deriveLogNormalParams();
const formulas = {
  weighted_qualification: "weighted_alpha_hours / total_participant_hours",
  communication_factor: "max(0.45, 1 - beta * ((participant_count - 1) / participant_count))",
  optimal_time: "(work_norm * story_points) / (weighted_qualification * communication_factor)",
  efficiency_index: "optimal_time / actual_hours",
  deviation_percent: "((actual_hours - planned_hours) / planned_hours) * 100",
  on_time_probability: "phi((ln_planned_hours - mu) / sigma)",
};

const modeledTasks: ModeledTask[] = tasks.map((task) => {
  const sprint = sprintById[task.sprintId];
  const weightedQualification = getWeightedQualification(task);
  const communicationFactor = getCommunicationFactor(task.assignments.length, beta);
  const optimalHours =
    (workNorms[task.complexity] * task.storyPoints) /
    (weightedQualification * communicationFactor);
  const efficiencyIndex = optimalHours / task.actualHours;
  const deviationPercent = ((task.actualHours - task.plannedHours) / task.plannedHours) * 100;
  const params = logNormalParams[task.complexity];
  const onTimeProbability =
    params.sigma === 0
      ? task.plannedHours >= Math.exp(params.mu)
        ? 1
        : 0
      : normalCdf((Math.log(task.plannedHours) - params.mu) / params.sigma);
  const participants = task.assignments.map((assignment) => {
    const member = membersById[assignment.memberId];
    return {
      name: member.name,
      role: member.role,
      qualification: member.qualification,
      hours: assignment.hours,
      alpha: alphaScale[member.qualification],
    };
  });

  return {
    id: task.id,
    title: task.title,
    sprintId: task.sprintId,
    sprintName: sprint.name,
    sprintStart: sprint.start,
    sprintEnd: sprint.end,
    storyPoints: task.storyPoints,
    complexity: task.complexity,
    plannedHours: task.plannedHours,
    actualHours: task.actualHours,
    status: task.status,
    participantCount: task.assignments.length,
    weightedQualification: roundTo(weightedQualification, 3),
    communicationFactor: roundTo(communicationFactor, 3),
    optimalHours: roundTo(optimalHours, 2),
    efficiencyIndex: roundTo(efficiencyIndex, 3),
    deviationPercent: roundTo(deviationPercent, 1),
    onTimeProbability: roundTo(onTimeProbability, 3),
    area: task.area,
    participants,
    hasJuniorContributor: participants.some((participant) => participant.qualification === "junior"),
    externalDependency: Boolean(task.externalDependency),
  };
});

const regressionCoefficients = solveRegressionCoefficients(
  modeledTasks
    .filter((task) => task.status === "completed")
    .map((task) => [1, task.storyPoints, task.weightedQualification, task.participantCount]),
  modeledTasks
    .filter((task) => task.status === "completed")
    .map((task) => Math.log(task.actualHours)),
);

const regression = {
  intercept: roundTo(regressionCoefficients[0], 3),
  sp: roundTo(regressionCoefficients[1], 3),
  qualification: roundTo(regressionCoefficients[2], 3),
  participants: roundTo(regressionCoefficients[3], 3),
};

const sprintSeries = sprints.map((sprint) => {
  const sprintTasks = modeledTasks.filter((task) => task.sprintId === sprint.id);
  const completedTasks = sprintTasks.filter((task) => task.status === "completed");
  const completedPoints = completedTasks.reduce((sum, task) => sum + task.storyPoints, 0);
  const sprintEi = geometricMean(completedTasks.map((task) => task.efficiencyIndex));

  return {
    sprint: sprint.name,
    planned: sprint.plannedStoryPoints,
    completed: completedPoints,
    sprintEi: roundTo(sprintEi, 3),
  };
});

const currentSprint = sprints[sprints.length - 1];
const currentSprintTasks = modeledTasks.filter((task) => task.sprintId === currentSprint.id);
const currentCompletedTasks = currentSprintTasks.filter((task) => task.status === "completed");
const currentCarryoverTasks = currentSprintTasks.filter((task) => task.status !== "completed");
const currentCompletedStoryPoints = currentCompletedTasks.reduce((sum, task) => sum + task.storyPoints, 0);
const currentBacklogCompletion = roundTo(
  (currentCompletedStoryPoints / currentSprint.plannedStoryPoints) * 100,
  1,
);
const currentSprintEi = roundTo(
  geometricMean(currentCompletedTasks.map((task) => task.efficiencyIndex)),
  3,
);

function getTaskReason(task: ModeledTask) {
  if (task.status !== "completed") {
    return "Задача не завершена в рамках спринта и уже вышла за пределы планового времени.";
  }
  if (task.onTimeProbability < 0.55) {
    return "По логнормальной модели вероятность уложиться в план ниже 55%.";
  }
  if (task.deviationPercent > 30) {
    return "Фактическое время отклонилось от плана больше чем на 30%.";
  }
  if (task.efficiencyIndex < 0.85) {
    return "Фактическое время заметно хуже теоретически оптимального времени модели.";
  }
  if (task.communicationFactor < 0.8) {
    return "Состав исполнителей заявки создаёт выраженные коммуникационные потери по закону Брукса.";
  }
  return "Задача требует дополнительного внимания по совокупности модельных факторов.";
}

function getTaskSeverity(task: ModeledTask) {
  if (
    task.status !== "completed" ||
    task.onTimeProbability < 0.45 ||
    task.deviationPercent > 40 ||
    task.efficiencyIndex < 0.75
  ) {
    return "high" as const;
  }
  return "medium" as const;
}

const problematicTasks = currentSprintTasks
  .filter(
    (task) =>
      task.status !== "completed" ||
      Math.abs(task.deviationPercent) > 30 ||
      task.efficiencyIndex < 0.85 ||
      task.onTimeProbability < 0.65,
  )
  .map((task) => ({
    ...task,
    severity: getTaskSeverity(task),
    reason: getTaskReason(task),
  }))
  .sort((left, right) => {
    if (left.severity === right.severity) {
      return left.onTimeProbability - right.onTimeProbability;
    }
    return left.severity === "high" ? -1 : 1;
  });

const probabilityBuckets = [
  {
    label: "Высокая вероятность",
    count: currentSprintTasks.filter((task) => task.onTimeProbability >= 0.8).length,
    percentage: roundTo(
      (currentSprintTasks.filter((task) => task.onTimeProbability >= 0.8).length / currentSprintTasks.length) * 100,
      1,
    ),
    color: "#10b981",
  },
  {
    label: "Умеренная вероятность",
    count: currentSprintTasks.filter((task) => task.onTimeProbability >= 0.6 && task.onTimeProbability < 0.8).length,
    percentage: roundTo(
      (currentSprintTasks.filter((task) => task.onTimeProbability >= 0.6 && task.onTimeProbability < 0.8).length /
        currentSprintTasks.length) *
        100,
      1,
    ),
    color: "#3b82f6",
  },
  {
    label: "Низкая вероятность",
    count: currentSprintTasks.filter((task) => task.onTimeProbability < 0.6).length,
    percentage: roundTo(
      (currentSprintTasks.filter((task) => task.onTimeProbability < 0.6).length / currentSprintTasks.length) * 100,
      1,
    ),
    color: "#f59e0b",
  },
];

const memberStats = members.map((member) => {
  const memberTasks = currentSprintTasks.filter((task) =>
    task.participants.some((participant) => participant.name === member.name),
  );
  const workload = memberTasks.reduce((sum, task) => {
    const participant = task.participants.find((candidate) => candidate.name === member.name);
    return sum + (participant?.hours ?? 0);
  }, 0);
  const utilizationPercent = roundTo((workload / member.capacityHours) * 100, 1);
  const weightedEfficiency = roundTo(
    mean(
      memberTasks.map((task) => {
        const participant = task.participants.find((candidate) => candidate.name === member.name);
        const share = participant ? participant.hours / task.actualHours : 0;
        return task.efficiencyIndex * (1 + share);
      }),
    ),
    3,
  );
  const averageProbability = roundTo(mean(memberTasks.map((task) => task.onTimeProbability)) * 100, 1);
  const status =
    utilizationPercent > 100
      ? "overloaded"
      : utilizationPercent < 70
      ? "underutilized"
      : "optimal";

  return {
    id: member.id,
    name: member.name,
    role: member.role,
    qualification: member.qualification,
    workload,
    capacity: member.capacityHours,
    status,
    utilizationPercent,
    weightedEfficiency,
    averageProbability,
  };
});

const complexityByRole = members.reduce<Record<string, { role: string; S: number; M: number; L: number; XL: number }>>(
  (accumulator, member) => {
    if (!accumulator[member.role]) {
      accumulator[member.role] = { role: member.role, S: 0, M: 0, L: 0, XL: 0 };
    }

    currentSprintTasks.forEach((task) => {
      if (task.participants.some((participant) => participant.name === member.name)) {
        accumulator[member.role][task.complexity] += 1;
      }
    });

    return accumulator;
  },
  {},
);

const complexityDistribution = (["S", "M", "L", "XL"] as ComplexityClass[]).map((code) => {
  const count = modeledTasks.filter((task) => task.complexity === code).length;
  return {
    code,
    name: complexityMeta[code].name,
    value: roundTo((count / modeledTasks.length) * 100, 1),
    color: complexityMeta[code].color,
  };
});

const estimateAccuracy = roundTo(
  Math.max(0, 100 - mean(currentCompletedTasks.map((task) => Math.abs(task.deviationPercent)))),
  1,
);

const riskScore = roundTo(
  Math.min(
    10,
    problematicTasks.length * 1.4 +
      currentCarryoverTasks.length * 1.8 +
      Math.max(0, 85 - currentBacklogCompletion) / 12 +
      Math.max(0, 1 - currentSprintEi) * 6,
  ),
  1,
);

const riskLabel = riskScore >= 7 ? "Высокий" : riskScore >= 4 ? "Средний" : "Низкий";

const mostProblematicComplexity = (["S", "M", "L", "XL"] as ComplexityClass[])
  .map((code) => {
    const relevant = modeledTasks.filter((task) => task.complexity === code && task.status === "completed");
    return {
      code,
      averageDeviation: mean(relevant.map((task) => task.deviationPercent)),
      averageEi: mean(relevant.map((task) => task.efficiencyIndex)),
    };
  })
  .sort((left, right) => right.averageDeviation - left.averageDeviation)[0];

const overloadedMembers = memberStats.filter((member) => member.status === "overloaded");
const underutilizedMembers = memberStats.filter((member) => member.status === "underutilized");
const juniorRiskTasks = currentSprintTasks.filter(
  (task) => task.hasJuniorContributor && (task.complexity === "L" || task.complexity === "XL"),
);
const communicationRiskTasks = currentSprintTasks.filter((task) => task.participantCount >= 4 && task.communicationFactor < 0.8);

const recommendations: Recommendation[] = [
  {
    id: "estimate-calibration",
    priority: "high",
    kind: "calibration",
    title: "Проверить плановые оценки заявок M и L",
    description:
      "По этим заявкам факт часто получается больше плана.",
    reason: `По файлу ${actualDatasetSummary.filename} суммарное превышение составило ${actualDatasetSummary.overrunHours} ч, или ${actualDatasetSummary.overrunPercent}%.`,
    metrics: [
      `План: ${actualDatasetSummary.plannedHours} ч`,
      `Факт: ${actualDatasetSummary.actualHours} ч`,
      `Отклонение: ${actualDatasetSummary.overrunPercent}%`,
    ],
  },
  {
    id: "future-sprint-planning",
    priority: "high",
    kind: "scope",
    title: "Оставлять запас времени в следующих спринтах",
    description:
      "При планировании лучше сразу учитывать возможный перерасход.",
    reason: `За период ${actualDatasetSummary.period} обработано ${actualDatasetSummary.requestCount} заявок в ${actualDatasetSummary.sprintCount} недельных спринтах.`,
    metrics: [
      `${actualDatasetSummary.sprintCount} спринтов`,
      `${actualDatasetSummary.requestCount} заявок`,
      `${actualDatasetSummary.assignmentRows} строк участия`,
    ],
  },
  {
    id: "low-ei-review",
    priority: problematicTasks.length > 0 ? "high" : "medium",
    kind: "risk",
    title: "Разобрать заявки с низким EI",
    description:
      "По таким заявкам стоит посмотреть причины перерасхода.",
    reason:
      problematicTasks.length > 0
        ? `В текущем спринте найдено ${problematicTasks.length} заявок с риском, низким EI или незавершенным статусом.`
        : "В текущем спринте нет критичных заявок по заданным порогам.",
    metrics: [
      `Средний EI: ${currentSprintEi}`,
      `Заявок с риском: ${problematicTasks.length}`,
      `Средняя P(Tfact ≤ Tplan): ${roundTo(mean(currentSprintTasks.map((task) => task.onTimeProbability)) * 100, 1)}%`,
    ],
  },
  {
    id: "overrun-control",
    priority: "medium",
    kind: "quality",
    title: "Следить за заявками с риском перерасхода",
    description: "Если вероятность уложиться в план низкая, заявку лучше проверять раньше.",
    reason: `Наибольшее среднее отклонение сейчас у класса ${mostProblematicComplexity.code}: ${roundTo(mostProblematicComplexity.averageDeviation, 1)}%.`,
    metrics: [
      `Класс: ${mostProblematicComplexity.code}`,
      `Среднее отклонение: ${roundTo(mostProblematicComplexity.averageDeviation, 1)}%`,
      `Средний EI: ${roundTo(mostProblematicComplexity.averageEi, 2)}`,
    ],
  },
  {
    id: "team-composition",
    priority: overloadedMembers.length > 0 || juniorRiskTasks.length > 0 ? "medium" : "low",
    kind: "team",
    title: "Проверять состав исполнителей",
    description:
      "Состав исполнителей влияет на квалификацию, коммуникации и итоговый EI.",
    reason:
      communicationRiskTasks.length > 0
        ? `Найдено ${communicationRiskTasks.length} заявок с 4+ участниками и f(M) < 0,8.`
        : `В команде ${actualDatasetSummary.teamMembers} участников с разделением роли и квалификации.`,
    metrics: [
      `Участников команды: ${actualDatasetSummary.teamMembers}`,
      `β: ${beta}`,
      `Заявок с f(M) < 0,8: ${communicationRiskTasks.length}`,
      `Средний f(M): ${roundTo(mean(currentSprintTasks.map((task) => task.communicationFactor)), 2)}`,
    ],
  },
];

export const projectAnalytics: ProjectAnalytics = {
  alphaScale,
  beta,
  workNorms,
  logNormalParams,
  regression,
  dashboard: {
    averageVelocity: roundTo(mean(sprintSeries.map((item) => item.completed)), 1),
    estimateAccuracy,
    currentBacklogCompletion,
    riskScore,
    riskLabel,
    inputFile: actualDatasetSummary.filename,
    period: actualDatasetSummary.period,
    sprintCount: actualDatasetSummary.sprintCount,
    requestCount: actualDatasetSummary.requestCount,
    assignmentRows: actualDatasetSummary.assignmentRows,
    teamMemberCount: actualDatasetSummary.teamMembers,
    consultations: actualDatasetSummary.consultations,
    errors: actualDatasetSummary.errors,
    improvements: actualDatasetSummary.improvements,
    plannedHours: actualDatasetSummary.plannedHours,
    actualHours: actualDatasetSummary.actualHours,
    deviationHours: actualDatasetSummary.overrunHours,
    deviationPercent: actualDatasetSummary.overrunPercent,
    optimalHours: roundTo(modeledTasks.reduce((sum, task) => sum + task.optimalHours, 0), 1),
    optimalDeviationPercent: roundTo(
      ((actualDatasetSummary.actualHours - modeledTasks.reduce((sum, task) => sum + task.optimalHours, 0)) /
        modeledTasks.reduce((sum, task) => sum + task.optimalHours, 0)) *
        100,
      1,
    ),
    onTimeProbability: roundTo(mean(modeledTasks.map((task) => task.onTimeProbability)) * 100, 1),
    sprintSeries,
    complexityDistribution,
    modelSummary: [
      {
        label: "Файл ВКР",
        value: actualDatasetSummary.filename,
        note: `${actualDatasetSummary.period}, ${actualDatasetSummary.requestCount} заявок`,
      },
      {
        label: "Структура заявок",
        value: `${actualDatasetSummary.consultations}/${actualDatasetSummary.errors}/${actualDatasetSummary.improvements}`,
        note: "Консультации / ошибки / доработки",
      },
      {
        label: "Регрессия ln(Tfact)",
        value: `${regression.intercept} + ${regression.sp}·SP ${regression.qualification < 0 ? "-" : "+"} ${Math.abs(regression.qualification)}·Q ${regression.participants < 0 ? "-" : "+"} ${Math.abs(regression.participants)}·M`,
        note: "Вклад SP, квалификации и размера команды",
      },
      {
        label: "Квалификации",
        value: Object.values(qualificationLabel).join(" / "),
        note: "Роли: аналитик, разработчик, руководитель проекта",
      },
    ],
  },
  sprint: {
    sprintName: currentSprint.name,
    dateLabel: `${new Date(currentSprint.start).toLocaleDateString("ru-RU")} - ${new Date(currentSprint.end).toLocaleDateString("ru-RU")}`,
    durationDays: Math.round(
      (new Date(currentSprint.end).getTime() - new Date(currentSprint.start).getTime()) / (1000 * 60 * 60 * 24),
    ) + 1,
    plannedStoryPoints: currentSprint.plannedStoryPoints,
    completedStoryPoints: currentCompletedStoryPoints,
    backlogCompletionIndex: currentBacklogCompletion,
    sprintEfficiencyIndex: currentSprintEi,
    averageTaskProbability: roundTo(mean(currentSprintTasks.map((task) => task.onTimeProbability)) * 100, 1),
    riskyTaskCount: problematicTasks.length,
    carryoverTasks: currentCarryoverTasks,
    problematicTasks,
    probabilityBuckets,
  },
  team: {
    totalMembers: members.length,
    overloadedCount: memberStats.filter((member) => member.status === "overloaded").length,
    averageUtilization: roundTo(mean(memberStats.map((member) => member.utilizationPercent)), 1),
    members: memberStats,
    loadDistribution: memberStats.map((member) => ({
      name: member.name,
      workload: member.workload,
      capacity: member.capacity,
    })),
    complexityByRole: Object.values(complexityByRole),
  },
  recommendations,
  taskDetails: modeledTasks,
  formulas,
  previewRows: currentSprintTasks.slice(0, 5).map((task) => ({
    id: task.id,
    sprint: task.sprintName,
    storyPoints: task.storyPoints,
    complexity: task.complexity,
    participants: task.participantCount,
    plannedHours: task.plannedHours,
    actualHours: task.actualHours,
  })),
  uploadFields: [
    "task_id",
    "sprint",
    "story_points",
    "complexity_class",
    "planned_hours",
    "actual_hours",
    "area",
    "participant_name",
    "participant_role",
    "qualification",
    "participant_hours",
  ],
};
