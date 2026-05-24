import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Calculator, Filter, GitBranch, Sigma, Users } from "lucide-react";
import { ensureBackendProjectId, getProjectTaskDetails, type BackendTaskDetails } from "../api/backend";
import { useProjects } from "../context/ProjectsContext";

type DetailedTask = BackendTaskDetails["tasks"][number];

export function TaskDetails() {
  const { selectedProject, linkProjectToBackend } = useProjects();
  const [payload, setPayload] = useState<BackendTaskDetails | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedSprint, setSelectedSprint] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      if (!selectedProject) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const projectId = await ensureBackendProjectId(selectedProject, linkProjectToBackend);
        const nextPayload = await getProjectTaskDetails(projectId);
        if (isCancelled) return;
        setPayload(nextPayload);
        setSelectedTaskId((current) => current || nextPayload.tasks[0]?.id || "");
      } catch (nextError) {
        if (!isCancelled) {
          setPayload(null);
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Не удалось загрузить детализацию задач проекта.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [linkProjectToBackend, selectedProject]);

  const sprintOptions = useMemo(() => {
    const values = new Set(payload?.tasks.map((task) => task.sprintName) ?? []);
    return ["all", ...Array.from(values)];
  }, [payload?.tasks]);

  const filteredTasks = useMemo(() => {
    return (payload?.tasks ?? []).filter((task) => {
      const sprintMatch = selectedSprint === "all" || task.sprintName === selectedSprint;
      const statusMatch = selectedStatus === "all" || task.status === selectedStatus;
      return sprintMatch && statusMatch;
    });
  }, [payload?.tasks, selectedSprint, selectedStatus]);

  useEffect(() => {
    if (!filteredTasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(filteredTasks[0]?.id ?? "");
    }
  }, [filteredTasks, selectedTaskId]);

  const selectedTask = filteredTasks.find((task) => task.id === selectedTaskId);

  if (isLoading) {
    return <div className="p-8 text-sm text-gray-500">Загружаем детализацию задач...</div>;
  }

  if (error) {
    return <div className="p-8 text-sm text-red-600">Ошибка: {error}</div>;
  }

  if (!payload?.hasData || payload.tasks.length === 0) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-gray-900">Детализация задач</h2>
          <p className="mt-3 text-sm text-gray-500">
            Для проекта {selectedProject?.name ?? "без названия"} пока нет рассчитанных задач.
            Загрузите Excel-файл, и здесь появятся промежуточные расчёты по каждой задаче.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Детализация задач</h2>
        <p className="mt-1 text-sm text-gray-500">
          Промежуточные расчёты модели по задачам проекта {payload.projectName}. Активная версия
          модели: #{payload.modelVersionNumber}.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="text-blue-600" size={18} />
              <h3 className="text-lg font-semibold text-gray-900">Фильтры</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Спринт</label>
                <select
                  value={selectedSprint}
                  onChange={(event) => setSelectedSprint(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {sprintOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "Все спринты" : option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Статус</label>
                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">Все статусы</option>
                  <option value="completed">completed</option>
                  <option value="in_progress">in_progress</option>
                  <option value="blocked">blocked</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Задачи</h3>
              <p className="mt-1 text-sm text-gray-500">
                Выберите задачу, чтобы увидеть все расчёты по формуле.
              </p>
            </div>
            <div className="max-h-[720px] divide-y divide-gray-200 overflow-y-auto">
              {filteredTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`w-full px-6 py-4 text-left transition-colors ${
                    selectedTaskId === task.id ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{task.id}</span>
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          {task.storyPoints} SP
                        </span>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          {task.complexity}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-900">{task.title}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {task.sprintName} · EI {task.efficiencyIndex} · P{" "}
                        {Math.round(task.onTimeProbability * 100)}%
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        task.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : task.status === "blocked"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {selectedTask ? (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-gray-900">{selectedTask.id}</h3>
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        {selectedTask.storyPoints} SP
                      </span>
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        {selectedTask.complexity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">{selectedTask.title}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedTask.sprintName} · area: {selectedTask.area ?? "n/a"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    Версия модели #{selectedTask.modelDetails.versionNumber}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <MetricCard
                  icon={<Sigma className="text-blue-600" size={18} />}
                  title="Q_i"
                  value={selectedTask.modelDetails.outputs.weightedQualification}
                  note="Взвешенная квалификация команды задачи"
                  formula={selectedTask.modelDetails.formulas.weighted_qualification}
                />
                <MetricCard
                  icon={<Users className="text-violet-600" size={18} />}
                  title="f(M_i)"
                  value={selectedTask.modelDetails.outputs.communicationFactor}
                  note="Коммуникационный множитель Брукса"
                  formula={selectedTask.modelDetails.formulas.communication_factor}
                />
                <MetricCard
                  icon={<Calculator className="text-emerald-600" size={18} />}
                  title="Topt_i"
                  value={`${selectedTask.modelDetails.outputs.optimalHours} ч`}
                  note="Теоретически оптимальное время"
                  formula={selectedTask.modelDetails.formulas.optimal_time}
                />
                <MetricCard
                  icon={<GitBranch className="text-amber-600" size={18} />}
                  title="EI_i"
                  value={selectedTask.modelDetails.outputs.efficiencyIndex}
                  note="Индекс эффективности задачи"
                  formula={selectedTask.modelDetails.formulas.efficiency_index}
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-900">Входные параметры</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <KeyValue label="Story Points" value={selectedTask.modelDetails.inputs.storyPoints} />
                  <KeyValue label="Класс сложности" value={selectedTask.modelDetails.inputs.complexityClass} />
                  <KeyValue label="Tplan_i" value={`${selectedTask.modelDetails.inputs.plannedHours} ч`} />
                  <KeyValue label="Tfact_i" value={`${selectedTask.modelDetails.inputs.actualHours} ч`} />
                  <KeyValue
                    label="Количество участников"
                    value={selectedTask.modelDetails.inputs.participantCount}
                  />
                  <KeyValue
                    label="Σ n_ij"
                    value={`${selectedTask.modelDetails.inputs.totalParticipantHours} ч`}
                  />
                  <KeyValue
                    label="Σ n_ij·α(q_j)"
                    value={selectedTask.modelDetails.inputs.weightedAlphaHours}
                  />
                  <KeyValue label="w_ci" value={selectedTask.modelDetails.inputs.workNorm} />
                  <KeyValue label="β" value={selectedTask.modelDetails.inputs.beta} />
                  <KeyValue label="μ" value={selectedTask.modelDetails.inputs.logNormalMu} />
                  <KeyValue label="σ" value={selectedTask.modelDetails.inputs.logNormalSigma} />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-900">Результаты модели</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <KeyValue
                    label="EI_i"
                    value={selectedTask.modelDetails.outputs.efficiencyIndex}
                  />
                  <KeyValue
                    label="δ_i"
                    value={`${selectedTask.modelDetails.outputs.deviationPercent}%`}
                  />
                  <KeyValue
                    label="P(Tfact ≤ Tplan)"
                    value={`${Math.round(selectedTask.modelDetails.outputs.onTimeProbability * 100)}%`}
                  />
                  <KeyValue
                    label="External dependency"
                    value={selectedTask.externalDependency ? "Да" : "Нет"}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-900">Участники задачи</h3>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="py-3 pr-4">Имя</th>
                        <th className="py-3 pr-4">Роль</th>
                        <th className="py-3 pr-4">Qualification</th>
                        <th className="py-3 pr-4">α(q_j)</th>
                        <th className="py-3">n_ij</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedTask.participants.map((participant) => (
                        <tr key={`${selectedTask.id}-${participant.name}`}>
                          <td className="py-3 pr-4 text-sm text-gray-900">{participant.name}</td>
                          <td className="py-3 pr-4 text-sm text-gray-600">{participant.role}</td>
                          <td className="py-3 pr-4 text-sm text-gray-600">{participant.qualification}</td>
                          <td className="py-3 pr-4 text-sm text-gray-600">{participant.alpha}</td>
                          <td className="py-3 text-sm text-gray-600">{participant.hours} ч</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-900">Формулы активной версии</h3>
                <div className="mt-5 space-y-4">
                  {Object.entries(selectedTask.modelDetails.formulas).map(([key, formula]) => (
                    <div key={key} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {key}
                      </div>
                      <div className="mt-2 font-mono text-sm text-gray-900">{formula}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
              Нет задач под выбранные фильтры.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  note,
  formula,
}: {
  icon: ReactNode;
  title: string;
  value: string | number;
  note: string;
  formula: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{title}</div>
          <div className="text-xs text-gray-500">{note}</div>
        </div>
      </div>
      <div className="mt-4 text-3xl font-semibold text-gray-900">{value}</div>
      <div className="mt-4 rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-700">{formula}</div>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}
