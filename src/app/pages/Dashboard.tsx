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
import { Clock, Target, CheckCircle, AlertTriangle } from "lucide-react";
import { useProjectAnalytics } from "../model/useProjectAnalytics";

export function Dashboard() {
  const analytics = useProjectAnalytics();
  const { dashboard, projectName, isLoading, error, hasData } = analytics;

  if (isLoading) {
    return <div className="p-8 text-sm text-gray-500">Загружаем метрики проекта...</div>;
  }

  if (error) {
    return <div className="p-8 text-sm text-red-600">Ошибка загрузки аналитики: {error}</div>;
  }

  if (!hasData) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-gray-900">Обзор аналитики</h2>
          <p className="mt-3 text-sm text-gray-500">
            Для проекта {projectName} пока нет рассчитанных метрик. Сначала загрузите Excel-файл
            во вкладке «Загрузка Excel». После этого сервер посчитает основные показатели.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Обзор аналитики</h2>
        <p className="text-sm text-gray-500 mt-1">
          Данные SCRUMS по файлу {dashboard.inputFile ?? projectName}.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-4 md:grid-cols-2">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="text-blue-600" size={20} />
            </div>
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
              {dashboard.sprintCount ?? dashboard.sprintSeries.length} спринтов
            </span>
          </div>
          <h3 className="text-sm text-gray-500">Плановые трудозатраты</h3>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{dashboard.plannedHours ?? 0} ч</p>
          <p className="text-xs text-gray-500 mt-2">{dashboard.requestCount ?? 0} заявок за период</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Target className="text-purple-600" size={20} />
            </div>
            <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded">
              Tfact
            </span>
          </div>
          <h3 className="text-sm text-gray-500">Фактические трудозатраты</h3>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{dashboard.actualHours ?? 0} ч</p>
          <p className="text-xs text-gray-500 mt-2">{dashboard.assignmentRows ?? 0} строк участия специалистов</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
              δ
            </span>
          </div>
          <h3 className="text-sm text-gray-500">Отклонение план/факт</h3>
          <p className="text-3xl font-semibold text-gray-900 mt-2">
            +{dashboard.deviationHours ?? 0} ч
          </p>
          <p className="text-xs text-gray-500 mt-2">+{dashboard.deviationPercent ?? 0}% к плановой оценке</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded">
              P(Tfact ≤ Tplan)
            </span>
          </div>
          <h3 className="text-sm text-gray-500">Вероятность выполнения в плане</h3>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{dashboard.onTimeProbability ?? 0}%</p>
          <p className="text-xs text-gray-500 mt-2">Средняя оценка по заявкам</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Анализ спринтов по объёму заявок</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-6">План и факт по спринтам</h3>
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
              <Bar dataKey="planned" name="Плановый объём" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Фактический объём" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Распределение заявок по типам
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
                    <p className="text-sm text-gray-500">{item.value}% всех заявок</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Параметры расчёта</h3>
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
