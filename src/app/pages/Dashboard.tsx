import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Target, CheckCircle, AlertTriangle } from "lucide-react";
import { useProjectAnalytics } from "../model/useProjectAnalytics";

export function Dashboard() {
  const analytics = useProjectAnalytics();
  const { dashboard, projectName, isLoading, error, hasData } = analytics;

  if (isLoading) {
    return <div className="p-8 text-sm text-gray-500">Загружаем реальные метрики проекта...</div>;
  }

  if (error) {
    return <div className="p-8 text-sm text-red-600">Ошибка загрузки аналитики: {error}</div>;
  }

  if (!hasData) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-gray-900">Обзор</h2>
          <p className="mt-3 text-sm text-gray-500">
            Для проекта {projectName} пока нет рассчитанных метрик. Сначала загрузите Excel-файл
            во вкладке «Загрузка данных», и backend построит аналитику по вашей математической
            модели.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Обзор</h2>
        <p className="text-sm text-gray-500 mt-1">
          Модельная аналитика проекта {projectName}: velocity, BCI, EI и параметры калибровки.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-4 md:grid-cols-2">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
              6 спринтов
            </span>
          </div>
          <h3 className="text-sm text-gray-500">Средняя velocity</h3>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{dashboard.averageVelocity}</p>
          <p className="text-xs text-gray-500 mt-2">Story Points за спринт</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Target className="text-purple-600" size={20} />
            </div>
            <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded">
              |δ| по факту
            </span>
          </div>
          <h3 className="text-sm text-gray-500">Точность оценки</h3>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{dashboard.estimateAccuracy}%</p>
          <p className="text-xs text-gray-500 mt-2">100% минус среднее абсолютное отклонение</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
              BCI
            </span>
          </div>
          <h3 className="text-sm text-gray-500">Выполнение бэклога</h3>
          <p className="text-3xl font-semibold text-gray-900 mt-2">
            {dashboard.currentBacklogCompletion}%
          </p>
          <p className="text-xs text-gray-500 mt-2">Текущий спринт против плана</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded">
              {dashboard.riskLabel}
            </span>
          </div>
          <h3 className="text-sm text-gray-500">Риск модели</h3>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{dashboard.riskScore}</p>
          <p className="text-xs text-gray-500 mt-2">Композитный скор 1–10</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Динамика velocity</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dashboard.sprintSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="sprint" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name="Выполнено SP"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">План, факт и EI спринта</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dashboard.sprintSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="sprint" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="planned" name="План SP" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Факт SP" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Распределение задач по классам сложности
          </h3>
          <div className="flex items-center gap-12 flex-col lg:flex-row">
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboard.complexityDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {dashboard.complexityDistribution.map((entry) => (
                      <Cell key={entry.code} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {dashboard.complexityDistribution.map((item) => (
                <div key={item.code} className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.value}% всех задач</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Параметры модели</h3>
          <div className="space-y-4">
            {dashboard.modelSummary.map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{item.label}</p>
                <p className="text-lg font-semibold text-gray-900 mt-2 break-words">{item.value}</p>
                <p className="text-sm text-gray-600 mt-2">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
