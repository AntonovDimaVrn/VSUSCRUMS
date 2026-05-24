export type ComplexityClass = "S" | "M" | "L" | "XL";
export type Qualification = "junior" | "middle" | "senior" | "analyst" | "pm";
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
  analyst: 0.9,
  pm: 0.55,
};

const complexityMeta: Record<ComplexityClass, { name: string; color: string }> = {
  S: { name: "S / простые", color: "#10b981" },
  M: { name: "M / средние", color: "#3b82f6" },
  L: { name: "L / сложные", color: "#f59e0b" },
  XL: { name: "XL / критические", color: "#ef4444" },
};

const members: TeamMember[] = [
  { id: "anna", name: "Анна Смирнова", role: "Тимлид", qualification: "senior", capacityHours: 40 },
  { id: "ivan", name: "Иван Иванов", role: "Backend разработчик", qualification: "senior", capacityHours: 40 },
  { id: "alex", name: "Алексей Коваленко", role: "Frontend разработчик", qualification: "middle", capacityHours: 40 },
  { id: "mikhail", name: "Михаил Петров", role: "Разработчик", qualification: "junior", capacityHours: 36 },
  { id: "elena", name: "Елена Сидорова", role: "Системный аналитик", qualification: "analyst", capacityHours: 38 },
  { id: "olga", name: "Ольга Морозова", role: "Продуктовый дизайнер", qualification: "analyst", capacityHours: 35 },
  { id: "pavel", name: "Павел Орлов", role: "Project Manager", qualification: "pm", capacityHours: 30 },
];

const sprints: Sprint[] = [
  { id: "s1", name: "Спринт 1", start: "2026-02-09", end: "2026-02-22", plannedStoryPoints: 34 },
  { id: "s2", name: "Спринт 2", start: "2026-02-23", end: "2026-03-08", plannedStoryPoints: 40 },
  { id: "s3", name: "Спринт 3", start: "2026-03-09", end: "2026-03-22", plannedStoryPoints: 42 },
  { id: "s4", name: "Спринт 4", start: "2026-03-23", end: "2026-04-05", plannedStoryPoints: 46 },
  { id: "s5", name: "Спринт 5", start: "2026-04-06", end: "2026-04-19", plannedStoryPoints: 48 },
  { id: "s6", name: "Спринт 6", start: "2026-04-20", end: "2026-05-03", plannedStoryPoints: 52 },
];

const tasks: Task[] = [
  {
    id: "TASK-101",
    title: "Авторизация профиля",
    sprintId: "s1",
    storyPoints: 5,
    complexity: "M",
    plannedHours: 20,
    actualHours: 18,
    status: "completed",
    area: "API",
    assignments: [
      { memberId: "ivan", hours: 10 },
      { memberId: "anna", hours: 6 },
      { memberId: "pavel", hours: 2 },
    ],
  },
  {
    id: "TASK-102",
    title: "Онбординг аналитики",
    sprintId: "s1",
    storyPoints: 3,
    complexity: "S",
    plannedHours: 12,
    actualHours: 16,
    status: "completed",
    area: "Analytics",
    assignments: [
      { memberId: "mikhail", hours: 9 },
      { memberId: "elena", hours: 7 },
    ],
  },
  {
    id: "TASK-103",
    title: "Интеграция push-уведомлений",
    sprintId: "s1",
    storyPoints: 8,
    complexity: "L",
    plannedHours: 32,
    actualHours: 38,
    status: "completed",
    area: "Infrastructure",
    assignments: [
      { memberId: "anna", hours: 8 },
      { memberId: "alex", hours: 12 },
      { memberId: "ivan", hours: 14 },
      { memberId: "pavel", hours: 4 },
    ],
  },
  {
    id: "TASK-104",
    title: "UI-фильтры dashboard",
    sprintId: "s1",
    storyPoints: 5,
    complexity: "M",
    plannedHours: 18,
    actualHours: 17,
    status: "completed",
    area: "UI",
    assignments: [
      { memberId: "alex", hours: 10 },
      { memberId: "olga", hours: 5 },
      { memberId: "elena", hours: 2 },
    ],
  },
  {
    id: "TASK-105",
    title: "Сбор crash telemetry",
    sprintId: "s1",
    storyPoints: 13,
    complexity: "XL",
    plannedHours: 52,
    actualHours: 56,
    status: "completed",
    area: "Platform",
    assignments: [
      { memberId: "anna", hours: 10 },
      { memberId: "ivan", hours: 20 },
      { memberId: "alex", hours: 12 },
      { memberId: "elena", hours: 8 },
      { memberId: "pavel", hours: 6 },
    ],
  },
  {
    id: "TASK-201",
    title: "Автоматизация release notes",
    sprintId: "s2",
    storyPoints: 5,
    complexity: "M",
    plannedHours: 18,
    actualHours: 16,
    status: "completed",
    area: "Process",
    assignments: [
      { memberId: "elena", hours: 6 },
      { memberId: "olga", hours: 8 },
      { memberId: "anna", hours: 2 },
    ],
  },
  {
    id: "TASK-202",
    title: "Offline sync",
    sprintId: "s2",
    storyPoints: 8,
    complexity: "L",
    plannedHours: 30,
    actualHours: 34,
    status: "completed",
    area: "Mobile",
    assignments: [
      { memberId: "ivan", hours: 12 },
      { memberId: "alex", hours: 10 },
      { memberId: "anna", hours: 8 },
      { memberId: "pavel", hours: 4 },
    ],
  },
  {
    id: "TASK-203",
    title: "Тюнинг search index",
    sprintId: "s2",
    storyPoints: 5,
    complexity: "M",
    plannedHours: 20,
    actualHours: 24,
    status: "completed",
    area: "Search",
    assignments: [
      { memberId: "mikhail", hours: 10 },
      { memberId: "ivan", hours: 8 },
      { memberId: "elena", hours: 6 },
    ],
  },
  {
    id: "TASK-204",
    title: "Dashboard widgets",
    sprintId: "s2",
    storyPoints: 8,
    complexity: "L",
    plannedHours: 28,
    actualHours: 26,
    status: "completed",
    area: "UI",
    assignments: [
      { memberId: "alex", hours: 14 },
      { memberId: "olga", hours: 6 },
      { memberId: "anna", hours: 6 },
    ],
  },
  {
    id: "TASK-205",
    title: "Экспорт аналитики",
    sprintId: "s2",
    storyPoints: 13,
    complexity: "XL",
    plannedHours: 48,
    actualHours: 64,
    status: "completed",
    area: "Analytics",
    assignments: [
      { memberId: "anna", hours: 12 },
      { memberId: "ivan", hours: 18 },
      { memberId: "alex", hours: 12 },
      { memberId: "elena", hours: 10 },
      { memberId: "pavel", hours: 12 },
    ],
    externalDependency: true,
  },
  {
    id: "TASK-301",
    title: "QA evidence board",
    sprintId: "s3",
    storyPoints: 5,
    complexity: "M",
    plannedHours: 16,
    actualHours: 15,
    status: "completed",
    area: "QA",
    assignments: [
      { memberId: "elena", hours: 8 },
      { memberId: "alex", hours: 5 },
      { memberId: "olga", hours: 2 },
    ],
  },
  {
    id: "TASK-302",
    title: "Платежная сверка",
    sprintId: "s3",
    storyPoints: 8,
    complexity: "L",
    plannedHours: 32,
    actualHours: 36,
    status: "completed",
    area: "Payments",
    assignments: [
      { memberId: "ivan", hours: 14 },
      { memberId: "anna", hours: 8 },
      { memberId: "elena", hours: 8 },
      { memberId: "pavel", hours: 6 },
    ],
  },
  {
    id: "TASK-303",
    title: "Heatmap загрузки команды",
    sprintId: "s3",
    storyPoints: 5,
    complexity: "M",
    plannedHours: 18,
    actualHours: 19,
    status: "completed",
    area: "Analytics",
    assignments: [
      { memberId: "mikhail", hours: 8 },
      { memberId: "alex", hours: 8 },
      { memberId: "elena", hours: 3 },
    ],
  },
  {
    id: "TASK-304",
    title: "Feature flags rollout",
    sprintId: "s3",
    storyPoints: 8,
    complexity: "L",
    plannedHours: 28,
    actualHours: 27,
    status: "completed",
    area: "Platform",
    assignments: [
      { memberId: "ivan", hours: 10 },
      { memberId: "alex", hours: 10 },
      { memberId: "anna", hours: 7 },
    ],
  },
  {
    id: "TASK-305",
    title: "Release governance",
    sprintId: "s3",
    storyPoints: 13,
    complexity: "XL",
    plannedHours: 50,
    actualHours: 47,
    status: "completed",
    area: "Process",
    assignments: [
      { memberId: "anna", hours: 12 },
      { memberId: "ivan", hours: 14 },
      { memberId: "elena", hours: 10 },
      { memberId: "pavel", hours: 11 },
    ],
  },
  {
    id: "TASK-306",
    title: "UI glossary cleanup",
    sprintId: "s3",
    storyPoints: 3,
    complexity: "S",
    plannedHours: 10,
    actualHours: 9,
    status: "completed",
    area: "UI",
    assignments: [
      { memberId: "olga", hours: 6 },
      { memberId: "mikhail", hours: 3 },
    ],
  },
  {
    id: "TASK-401",
    title: "Sprint risk scoring",
    sprintId: "s4",
    storyPoints: 8,
    complexity: "L",
    plannedHours: 30,
    actualHours: 28,
    status: "completed",
    area: "Analytics",
    assignments: [
      { memberId: "anna", hours: 8 },
      { memberId: "alex", hours: 12 },
      { memberId: "elena", hours: 6 },
      { memberId: "pavel", hours: 2 },
    ],
  },
  {
    id: "TASK-402",
    title: "Data retention policy",
    sprintId: "s4",
    storyPoints: 5,
    complexity: "M",
    plannedHours: 18,
    actualHours: 20,
    status: "completed",
    area: "Data",
    assignments: [
      { memberId: "ivan", hours: 9 },
      { memberId: "elena", hours: 7 },
      { memberId: "pavel", hours: 4 },
    ],
  },
  {
    id: "TASK-403",
    title: "Редизайн сложных фильтров",
    sprintId: "s4",
    storyPoints: 8,
    complexity: "L",
    plannedHours: 32,
    actualHours: 37,
    status: "completed",
    area: "UI",
    assignments: [
      { memberId: "alex", hours: 14 },
      { memberId: "olga", hours: 10 },
      { memberId: "anna", hours: 8 },
      { memberId: "elena", hours: 5 },
    ],
  },
  {
    id: "TASK-404",
    title: "Notification center",
    sprintId: "s4",
    storyPoints: 5,
    complexity: "M",
    plannedHours: 18,
    actualHours: 17,
    status: "completed",
    area: "Mobile",
    assignments: [
      { memberId: "mikhail", hours: 8 },
      { memberId: "alex", hours: 7 },
      { memberId: "olga", hours: 2 },
    ],
  },
  {
    id: "TASK-405",
    title: "Cross-team metrics sync",
    sprintId: "s4",
    storyPoints: 13,
    complexity: "XL",
    plannedHours: 52,
    actualHours: 60,
    status: "completed",
    area: "Integration",
    assignments: [
      { memberId: "anna", hours: 10 },
      { memberId: "ivan", hours: 16 },
      { memberId: "elena", hours: 12 },
      { memberId: "pavel", hours: 10 },
      { memberId: "alex", hours: 12 },
    ],
    externalDependency: true,
  },
  {
    id: "TASK-406",
    title: "Smoke-suite cleanup",
    sprintId: "s4",
    storyPoints: 7,
    complexity: "L",
    plannedHours: 26,
    actualHours: 24,
    status: "completed",
    area: "QA",
    assignments: [
      { memberId: "mikhail", hours: 10 },
      { memberId: "elena", hours: 10 },
      { memberId: "anna", hours: 4 },
    ],
  },
  {
    id: "TASK-501",
    title: "Refactor mobile alerts",
    sprintId: "s5",
    storyPoints: 8,
    complexity: "L",
    plannedHours: 30,
    actualHours: 33,
    status: "completed",
    area: "Mobile",
    assignments: [
      { memberId: "ivan", hours: 12 },
      { memberId: "alex", hours: 10 },
      { memberId: "anna", hours: 8 },
      { memberId: "pavel", hours: 3 },
    ],
  },
  {
    id: "TASK-502",
    title: "Шаблоны sprint report",
    sprintId: "s5",
    storyPoints: 5,
    complexity: "M",
    plannedHours: 17,
    actualHours: 15,
    status: "completed",
    area: "Process",
    assignments: [
      { memberId: "elena", hours: 7 },
      { memberId: "olga", hours: 6 },
      { memberId: "pavel", hours: 2 },
    ],
  },
  {
    id: "TASK-503",
    title: "Карта зависимостей бэклога",
    sprintId: "s5",
    storyPoints: 3,
    complexity: "S",
    plannedHours: 10,
    actualHours: 11,
    status: "completed",
    area: "Analytics",
    assignments: [
      { memberId: "elena", hours: 5 },
      { memberId: "pavel", hours: 3 },
      { memberId: "olga", hours: 3 },
    ],
  },
  {
    id: "TASK-504",
    title: "Accessibility audit fixes",
    sprintId: "s5",
    storyPoints: 5,
    complexity: "M",
    plannedHours: 18,
    actualHours: 17,
    status: "completed",
    area: "UI",
    assignments: [
      { memberId: "alex", hours: 9 },
      { memberId: "olga", hours: 5 },
      { memberId: "mikhail", hours: 3 },
    ],
  },
  {
    id: "TASK-505",
    title: "Role matrix permissions",
    sprintId: "s5",
    storyPoints: 13,
    complexity: "XL",
    plannedHours: 50,
    actualHours: 57,
    status: "completed",
    area: "Security",
    assignments: [
      { memberId: "anna", hours: 12 },
      { memberId: "ivan", hours: 16 },
      { memberId: "alex", hours: 12 },
      { memberId: "elena", hours: 7 },
      { memberId: "pavel", hours: 10 },
    ],
  },
  {
    id: "TASK-506",
    title: "Release rollback flow",
    sprintId: "s5",
    storyPoints: 8,
    complexity: "L",
    plannedHours: 30,
    actualHours: 29,
    status: "completed",
    area: "Platform",
    assignments: [
      { memberId: "ivan", hours: 12 },
      { memberId: "anna", hours: 8 },
      { memberId: "alex", hours: 9 },
    ],
  },
  {
    id: "TASK-507",
    title: "Resiliency metrics pipeline",
    sprintId: "s5",
    storyPoints: 6,
    complexity: "M",
    plannedHours: 22,
    actualHours: 21,
    status: "completed",
    area: "Data",
    assignments: [
      { memberId: "ivan", hours: 8 },
      { memberId: "mikhail", hours: 8 },
      { memberId: "elena", hours: 5 },
    ],
  },
  {
    id: "TASK-601",
    title: "Smart backlog planner",
    sprintId: "s6",
    storyPoints: 13,
    complexity: "XL",
    plannedHours: 54,
    actualHours: 49,
    status: "completed",
    area: "Analytics",
    assignments: [
      { memberId: "anna", hours: 12 },
      { memberId: "ivan", hours: 14 },
      { memberId: "elena", hours: 10 },
      { memberId: "pavel", hours: 6 },
      { memberId: "alex", hours: 7 },
    ],
  },
  {
    id: "TASK-602",
    title: "Dashboard anomaly alerts",
    sprintId: "s6",
    storyPoints: 8,
    complexity: "L",
    plannedHours: 30,
    actualHours: 27,
    status: "completed",
    area: "Analytics",
    assignments: [
      { memberId: "alex", hours: 12 },
      { memberId: "ivan", hours: 8 },
      { memberId: "elena", hours: 5 },
      { memberId: "pavel", hours: 2 },
    ],
  },
  {
    id: "TASK-603",
    title: "QA auto-checklists",
    sprintId: "s6",
    storyPoints: 5,
    complexity: "M",
    plannedHours: 16,
    actualHours: 14,
    status: "completed",
    area: "QA",
    assignments: [
      { memberId: "elena", hours: 8 },
      { memberId: "mikhail", hours: 4 },
      { memberId: "olga", hours: 2 },
    ],
  },
  {
    id: "TASK-604",
    title: "Team capacity rebalance",
    sprintId: "s6",
    storyPoints: 5,
    complexity: "M",
    plannedHours: 18,
    actualHours: 26,
    status: "completed",
    area: "Process",
    assignments: [
      { memberId: "anna", hours: 8 },
      { memberId: "elena", hours: 7 },
      { memberId: "pavel", hours: 4 },
      { memberId: "alex", hours: 7 },
    ],
  },
  {
    id: "TASK-605",
    title: "Billing edge-cases",
    sprintId: "s6",
    storyPoints: 8,
    complexity: "L",
    plannedHours: 32,
    actualHours: 39,
    status: "blocked",
    area: "Payments",
    assignments: [
      { memberId: "ivan", hours: 12 },
      { memberId: "anna", hours: 10 },
      { memberId: "mikhail", hours: 11 },
      { memberId: "pavel", hours: 6 },
    ],
    externalDependency: true,
  },
  {
    id: "TASK-606",
    title: "Design token migration",
    sprintId: "s6",
    storyPoints: 8,
    complexity: "L",
    plannedHours: 26,
    actualHours: 24,
    status: "completed",
    area: "UI",
    assignments: [
      { memberId: "alex", hours: 12 },
      { memberId: "olga", hours: 8 },
      { memberId: "anna", hours: 4 },
    ],
  },
  {
    id: "TASK-607",
    title: "Data freshness monitor",
    sprintId: "s6",
    storyPoints: 5,
    complexity: "M",
    plannedHours: 18,
    actualHours: 16,
    status: "completed",
    area: "Data",
    assignments: [
      { memberId: "ivan", hours: 6 },
      { memberId: "elena", hours: 8 },
      { memberId: "mikhail", hours: 2 },
    ],
  },
];

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
    return "Состав задачи создаёт выраженные коммуникационные потери по закону Брукса.";
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
    id: "scope-balance",
    priority: currentBacklogCompletion < 85 ? "high" : "medium",
    kind: "scope",
    title: "Сбалансировать объём следующего спринта относительно расчетной velocity",
    description:
      currentBacklogCompletion < 85
        ? "План текущего спринта оказался выше фактической пропускной способности команды."
        : "Планирование близко к рабочему диапазону, но требует небольшого буфера на риск.",
    reason: `BCI текущего спринта = ${currentBacklogCompletion}%, а средняя velocity по истории = ${roundTo(mean(sprintSeries.map((item) => item.completed)), 1)} SP.`,
    metrics: [
      `BCI: ${currentBacklogCompletion}%`,
      `Средняя velocity: ${roundTo(mean(sprintSeries.map((item) => item.completed)), 1)} SP`,
      `Текущий план: ${currentSprint.plannedStoryPoints} SP`,
    ],
  },
  {
    id: "workload-redistribution",
    priority: overloadedMembers.length > 0 ? "high" : "low",
    kind: "team",
    title: "Перераспределить часы между перегруженными и недогруженными участниками",
    description:
      overloadedMembers.length > 0
        ? "В текущем спринте есть участники, работающие сверх своей доступной ёмкости."
        : "Нагрузка распределена достаточно ровно, но мониторинг стоит сохранить.",
    reason: overloadedMembers.length > 0
      ? `Перегружены: ${overloadedMembers.map((member) => member.name).join(", ")}. Недогружены: ${underutilizedMembers.map((member) => member.name).join(", ") || "нет"}.`
      : "Критических перегрузок по текущему набору задач модель не обнаружила.",
    metrics: [
      `Перегружено участников: ${overloadedMembers.length}`,
      `Средняя утилизация: ${roundTo(mean(memberStats.map((member) => member.utilizationPercent)), 1)}%`,
      `Недогружено участников: ${underutilizedMembers.length}`,
    ],
  },
  {
    id: "junior-pairing",
    priority: juniorRiskTasks.length > 0 ? "high" : "medium",
    kind: "risk",
    title: "Сложные задачи с junior-участием переводить в парное исполнение",
    description:
      juniorRiskTasks.length > 0
        ? "Модель показывает, что junior-участники на L/XL-задачах повышают риск выхода за план."
        : "Junior-участие в сложных задачах сейчас не доминирует, но правило pairing полезно сохранить.",
    reason:
      juniorRiskTasks.length > 0
        ? `В текущем спринте ${juniorRiskTasks.length} задач класса L/XL содержат junior-вклад. Средняя вероятность уложиться в срок по ним = ${roundTo(mean(juniorRiskTasks.map((task) => task.onTimeProbability)) * 100, 1)}%.`
        : "Сложные задачи преимущественно закрываются middle/senior составом.",
    metrics: [
      `Задач L/XL с junior: ${juniorRiskTasks.length}`,
      `Средний EI по ним: ${roundTo(mean(juniorRiskTasks.map((task) => task.efficiencyIndex)), 2)}`,
      `Средний P(Tfact ≤ Tplan): ${roundTo(mean(juniorRiskTasks.map((task) => task.onTimeProbability)) * 100, 1)}%`,
    ],
  },
  {
    id: "complexity-calibration",
    priority: mostProblematicComplexity.averageDeviation > 20 ? "medium" : "low",
    kind: "calibration",
    title: `Перекалибровать норматив w_${mostProblematicComplexity.code} для класса ${mostProblematicComplexity.code}`,
    description: "Наиболее нестабильный класс задач даёт самый большой разрыв между планом и фактом.",
    reason: `Для класса ${mostProblematicComplexity.code} среднее отклонение = ${roundTo(mostProblematicComplexity.averageDeviation, 1)}%, а средний EI = ${roundTo(mostProblematicComplexity.averageEi, 2)}.`,
    metrics: [
      `w_${mostProblematicComplexity.code}: ${workNorms[mostProblematicComplexity.code]} ч/SP`,
      `Среднее отклонение: ${roundTo(mostProblematicComplexity.averageDeviation, 1)}%`,
      `Средний EI: ${roundTo(mostProblematicComplexity.averageEi, 2)}`,
    ],
  },
  {
    id: "communication-losses",
    priority: communicationRiskTasks.length > 0 ? "medium" : "low",
    kind: "quality",
    title: "Снижать количество участников на задачах с высоким коммуникационным штрафом",
    description:
      communicationRiskTasks.length > 0
        ? "Часть задач теряет эффективность из-за большого количества участников."
        : "Сильных коммуникационных штрафов в текущем спринте почти нет.",
    reason:
      communicationRiskTasks.length > 0
        ? `Найдено ${communicationRiskTasks.length} задач с 4+ участниками и f(M) < 0,8.`
        : `Оцененный коэффициент Брукса β = ${beta}.`,
    metrics: [
      `β: ${beta}`,
      `Задач с f(M) < 0,8: ${communicationRiskTasks.length}`,
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
    sprintSeries,
    complexityDistribution,
    modelSummary: [
      {
        label: "β Брукса",
        value: beta.toString().replace(".", ","),
        note: "Коэффициент коммуникационных потерь",
      },
      {
        label: "w(S/M/L/XL)",
        value: `${workNorms.S}/${workNorms.M}/${workNorms.L}/${workNorms.XL}`,
        note: "Норматив трудоёмкости в часах на Story Point",
      },
      {
        label: "Регрессия ln(Tfact)",
        value: `${regression.intercept} + ${regression.sp}·SP ${regression.qualification < 0 ? "-" : "+"} ${Math.abs(regression.qualification)}·Q ${regression.participants < 0 ? "-" : "+"} ${Math.abs(regression.participants)}·M`,
        note: "Оценка вклада SP, квалификации и размера команды",
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
    "participant_name",
    "qualification",
    "participant_hours",
  ],
};
