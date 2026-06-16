import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Calendar, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import {
  ensureBackendProjectId,
  getProjectTaskDetails,
  type BackendModeledTask,
  type BackendTaskDetails,
} from "../api/backend";
import { useProjects } from "../context/ProjectsContext";
import { useProjectAnalytics } from "../model/useProjectAnalytics";
import type { ModeledTask } from "../model/projectAnalytics";

type SprintTask = (BackendModeledTask | ModeledTask) & {
  sprintStart?: string;
  sprintEnd?: string;
  severity?: "high" | "medium";
  reason?: string;
};

type SelectedSprintMetrics = {
  sprintName: string;
  dateLabel: string;
  durationDays: number;
  plannedStoryPoints: number;
  completedStoryPoints: number;
  backlogCompletionIndex: number;
  sprintEfficiencyIndex: number;
  averageTaskProbability: number;
  riskyTaskCount: number;
  carryoverTasks: SprintTask[];
  problematicTasks: Array<SprintTask & { severity: "high" | "medium"; reason: string }>;
  probabilityBuckets: Array<{
    label: string;
    count: number;
    percentage: number;
    color: string;
  }>;
};

const statusLabel: Record<string, string> = {
  completed: "выполнена",
  in_progress: "в работе",
  blocked: "заблокирована",
};

export function SprintAnalysis() {
  const analytics = useProjectAnalytics();
  const { selectedProject, linkProjectToBackend } = useProjects();
  const { sprint, projectName, isLoading, error, hasData } = analytics;
  const [taskPayload, setTaskPayload] = useState<BackendTaskDetails | null>(null);
  const [selectedSprintName, setSelectedSprintName] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const loadTaskDetails = async () => {
      if (!selectedProject?.backendId) {
        setTaskPayload(null);
        return;
      }

      try {
        const projectId = await ensureBackendProjectId(selectedProject, linkProjectToBackend);
        const payload = await getProjectTaskDetails(projectId);
        if (!isCancelled) {
          setTaskPayload(payload);
        }
      } catch {
        if (!isCancelled) {
          setTaskPayload(null);
        }
      }
    };

    void loadTaskDetails();

    return () => {
      isCancelled = true;
    };
  }, [linkProjectToBackend, selectedProject]);

  const sprintTasks = useMemo<SprintTask[]>(() => {
    if (taskPayload?.hasData) {
      return taskPayload.tasks as SprintTask[];
    }
    return (analytics.taskDetails ?? []) as SprintTask[];
  }, [analytics.taskDetails, taskPayload]);

  const sprintOptions = useMemo(() => {
    const names = Array.from(new Set(sprintTasks.map((task) => task.sprintName)));
    return names.sort((left, right) => getSprintNumber(left) - getSprintNumber(right));
  }, [sprintTasks]);

  useEffect(() => {
    if (sprintOptions.length === 0) return;
    setSelectedSprintName((current) => {
      if (current && sprintOptions.includes(current)) return current;
      return sprintOptions[sprintOptions.length - 1];
    });
  }, [sprintOptions]);

  const selectedSprint = useMemo(() => {
    const targetName = selectedSprintName || sprint.sprintName;
    const tasks = sprintTasks.filter((task) => task.sprintName === targetName);
    if (tasks.length === 0) return sprint;
    return buildSprintMetrics(targetName, tasks);
  }, [selectedSprintName, sprint, sprintTasks]);

  const completionData = [
    { category: "Запланировано", value: selectedSprint.plannedStoryPoints, color: "#93c5fd" },
    { category: "Выполнено", value: selectedSprint.completedStoryPoints, color: "#3b82f6" },
  ];

  if (isLoading) {
    return <div className="p-8 text-sm text-gray-500">Загружаем анализ спринтов...</div>;
  }

  if (error && sprintTasks.length === 0) {
    return <div className="p-8 text-sm text-red-600">Ошибка загрузки аналитики: {error}</div>;
  }

  if (!hasData) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-gray-900">Анализ спринтов</h2>
          <p className="mt-3 text-sm text-gray-500">
            Для проекта {projectName} ещё нет рассчитанных спринтов. Загрузите данные проекта, и
            сервер пересчитает EI, вероятность уложиться в план и проблемные заявки.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Анализ спринтов</h2>
          <p className="text-sm text-gray-500 mt-1">
            Показатели выбранного спринта проекта {projectName}
          </p>
        </div>

        <div className="w-full max-w-sm space-y-2">
          <label htmlFor="sprint-select" className="text-sm font-medium text-gray-700">
            Спринт
          </label>
          <select
            id="sprint-select"
            value={selectedSprint.sprintName}
            onChange={(event) => setSelectedSprintName(event.target.value)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {sprintOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-4 md:grid-cols-2">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">{selectedSprint.sprintName}</h3>
          </div>
          <p className="text-sm text-gray-900 font-medium">{selectedSprint.dateLabel}</p>
          <p className="text-xs text-gray-500 mt-1">{selectedSprint.durationDays} дней</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">Выполнение планового объёма</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{selectedSprint.backlogCompletionIndex}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {selectedSprint.completedStoryPoints} из {selectedSprint.plannedStoryPoints} SP
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">Эффективность выполнения заявок</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{selectedSprint.sprintEfficiencyIndex}</p>
          <p className="text-xs text-gray-500 mt-1">Среднее геометрическое по EI заявок</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">Риск превышения плановой оценки</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{selectedSprint.riskyTaskCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            Средний P(Tfact ≤ Tplan): {selectedSprint.averageTaskProbability}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">План и выполненный объём</h3>
          <p className="text-sm text-gray-500 mt-1">
            Сравнение планового и выполненного объёма для выбранного спринта
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={completionData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={120} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {completionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Вероятность уложиться в срок</h3>
          <p className="text-sm text-gray-500 mt-1">
            Расчёт по заявкам выбранного спринта
          </p>
        </div>
        <div className="space-y-4">
          {selectedSprint.probabilityBuckets.map((bucket) => (
            <div key={bucket.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{bucket.label}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {bucket.count} заявок ({bucket.percentage}%)
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full"
                  style={{ width: `${bucket.percentage}%`, backgroundColor: bucket.color }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Проблемные заявки</h3>
          <p className="text-sm text-gray-500 mt-1">Заявки выбранного спринта с риском или перерасходом</p>
        </div>
        <div className="divide-y divide-gray-200">
          {selectedSprint.problematicTasks.length === 0 && (
            <div className="px-6 py-8 text-sm text-gray-500">Проблемных заявок нет.</div>
          )}
          {selectedSprint.problematicTasks.map((task) => (
            <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{task.id}</span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        task.severity === "high"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {task.severity === "high" ? "Высокий риск" : "Средний риск"}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {task.storyPoints} SP / {task.complexity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 mt-2">{task.title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    EI = {task.efficiencyIndex}, δ = {task.deviationPercent}%, P ={" "}
                    {Math.round(task.onTimeProbability * 100)}%
                  </p>
                  <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 rounded-lg">
                    <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-900">{task.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Переносимые заявки</h3>
          <p className="text-sm text-gray-500 mt-1">Незавершённые заявки выбранного спринта</p>
        </div>
        <div className="divide-y divide-gray-200">
          {selectedSprint.carryoverTasks.length === 0 && (
            <div className="px-6 py-8 text-sm text-gray-500">Переносов нет.</div>
          )}
          {selectedSprint.carryoverTasks.map((task) => (
            <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{task.id}</span>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {task.storyPoints} SP
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                      {statusLabel[task.status] ?? task.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 mt-1">{task.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    P(Tfact ≤ Tplan): {Math.round(task.onTimeProbability * 100)}%, f(M) ={" "}
                    {task.communicationFactor}, Q = {task.weightedQualification}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildSprintMetrics(sprintName: string, tasks: SprintTask[]): SelectedSprintMetrics {
  const completedTasks = tasks.filter((task) => task.status === "completed");
  const plannedStoryPoints = roundTo(sum(tasks.map((task) => task.storyPoints)), 1);
  const completedStoryPoints = roundTo(sum(completedTasks.map((task) => task.storyPoints)), 1);
  const sprintEfficiencyIndex = roundTo(geometricMean(completedTasks.map((task) => task.efficiencyIndex)), 3);
  const carryoverTasks = tasks.filter((task) => task.status !== "completed");
  const problematicTasks = tasks
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

  return {
    sprintName,
    dateLabel: getSprintDateLabel(tasks),
    durationDays: getSprintDurationDays(tasks),
    plannedStoryPoints,
    completedStoryPoints,
    backlogCompletionIndex: roundTo((completedStoryPoints / Math.max(plannedStoryPoints, 1)) * 100, 1),
    sprintEfficiencyIndex,
    averageTaskProbability: roundTo(mean(tasks.map((task) => task.onTimeProbability)) * 100, 1),
    riskyTaskCount: problematicTasks.length,
    carryoverTasks,
    problematicTasks,
    probabilityBuckets: buildProbabilityBuckets(tasks),
  };
}

function buildProbabilityBuckets(tasks: SprintTask[]) {
  const total = tasks.length || 1;
  const buckets = [
    {
      label: "Высокая вероятность",
      count: tasks.filter((task) => task.onTimeProbability >= 0.8).length,
      color: "#10b981",
    },
    {
      label: "Умеренная вероятность",
      count: tasks.filter((task) => task.onTimeProbability >= 0.6 && task.onTimeProbability < 0.8).length,
      color: "#3b82f6",
    },
    {
      label: "Низкая вероятность",
      count: tasks.filter((task) => task.onTimeProbability < 0.6).length,
      color: "#f59e0b",
    },
  ];

  return buckets.map((bucket) => ({
    ...bucket,
    percentage: roundTo((bucket.count / total) * 100, 1),
  }));
}

function getTaskReason(task: SprintTask) {
  if (task.status !== "completed") {
    return "Заявка не завершена в рамках выбранного спринта и требует переноса или уточнения плана.";
  }
  if (task.onTimeProbability < 0.55) {
    return "По логнормальной модели вероятность выполнить заявку в пределах плана ниже 55%.";
  }
  if (task.deviationPercent > 30) {
    return "Фактические трудозатраты отклонились от плановой оценки больше чем на 30%.";
  }
  if (task.efficiencyIndex < 0.85) {
    return "Фактические трудозатраты заметно хуже теоретически оптимального времени модели.";
  }
  if (task.communicationFactor < 0.8) {
    return "Состав исполнителей заявки создаёт выраженные коммуникационные потери по закону Брукса.";
  }
  return "Заявка требует дополнительного внимания по совокупности модельных факторов.";
}

function getTaskSeverity(task: SprintTask) {
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

function getSprintDateLabel(tasks: SprintTask[]) {
  const first = tasks[0];
  if (!first?.sprintStart || !first.sprintEnd) {
    return "Даты спринта не заданы";
  }
  return `${new Date(first.sprintStart).toLocaleDateString("ru-RU")} - ${new Date(first.sprintEnd).toLocaleDateString("ru-RU")}`;
}

function getSprintDurationDays(tasks: SprintTask[]) {
  const first = tasks[0];
  if (!first?.sprintStart || !first.sprintEnd) return 0;
  const start = new Date(first.sprintStart).getTime();
  const end = new Date(first.sprintEnd).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

function getSprintNumber(value: string) {
  return Number(value.match(/\d+/)?.[0] ?? 0);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function mean(values: number[]) {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

function geometricMean(values: number[]) {
  const safeValues = values.filter((value) => value > 0);
  if (safeValues.length === 0) return 0;
  return Math.exp(mean(safeValues.map((value) => Math.log(value))));
}

function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
