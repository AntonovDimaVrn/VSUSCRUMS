import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Calendar, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useProjectAnalytics } from "../model/useProjectAnalytics";

export function SprintAnalysis() {
  const { sprint, projectName, isLoading, error, hasData } = useProjectAnalytics();

  const completionData = [
    { category: "Запланировано", value: sprint.plannedStoryPoints, color: "#93c5fd" },
    { category: "Выполнено", value: sprint.completedStoryPoints, color: "#3b82f6" },
  ];

  if (isLoading) {
    return <div className="p-8 text-sm text-gray-500">Загружаем анализ спринта...</div>;
  }

  if (error) {
    return <div className="p-8 text-sm text-red-600">Ошибка загрузки аналитики: {error}</div>;
  }

  if (!hasData) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-gray-900">Анализ спринта</h2>
          <p className="mt-3 text-sm text-gray-500">
            Для проекта {projectName} ещё нет рассчитанного спринта. Загрузите данные проекта, и
            backend пересчитает BCI, EI, вероятности сроков и проблемные задачи.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Анализ спринта</h2>
        <p className="text-sm text-gray-500 mt-1">
          Метрики модели для {sprint.sprintName} проекта {projectName}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-4 md:grid-cols-2">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">{sprint.sprintName}</h3>
          </div>
          <p className="text-sm text-gray-900 font-medium">{sprint.dateLabel}</p>
          <p className="text-xs text-gray-500 mt-1">{sprint.durationDays} дней</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">BCI спринта</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{sprint.backlogCompletionIndex}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {sprint.completedStoryPoints} из {sprint.plannedStoryPoints} SP
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">EI спринта</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{sprint.sprintEfficiencyIndex}</p>
          <p className="text-xs text-gray-500 mt-1">Среднее геометрическое по EI задач</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">Риск-задачи</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{sprint.riskyTaskCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            Средний P(Tfact ≤ Tplan): {sprint.averageTaskProbability}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">План и выполненный объём</h3>
          <p className="text-sm text-gray-500 mt-1">
            Сравнение planned SP и completed SP для текущего спринта
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
            Логнормальная модель по текущему набору задач вместо фиксированных экспертных оценок
          </p>
        </div>
        <div className="space-y-4">
          {sprint.probabilityBuckets.map((bucket) => (
            <div key={bucket.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{bucket.label}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {bucket.count} задач ({bucket.percentage}%)
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
          <h3 className="text-lg font-semibold text-gray-900">Проблемные задачи</h3>
          <p className="text-sm text-gray-500 mt-1">Задачи, где модель показывает риск или перерасход</p>
        </div>
        <div className="divide-y divide-gray-200">
          {sprint.problematicTasks.map((task) => (
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
          <h3 className="text-lg font-semibold text-gray-900">Переносимые задачи</h3>
          <p className="text-sm text-gray-500 mt-1">Незавершённые задачи текущего спринта</p>
        </div>
        <div className="divide-y divide-gray-200">
          {sprint.carryoverTasks.length === 0 && (
            <div className="px-6 py-8 text-sm text-gray-500">Переносов нет.</div>
          )}
          {sprint.carryoverTasks.map((task) => (
            <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{task.id}</span>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {task.storyPoints} SP
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                      {task.status === "blocked" ? "Заблокирована" : "В работе"}
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
