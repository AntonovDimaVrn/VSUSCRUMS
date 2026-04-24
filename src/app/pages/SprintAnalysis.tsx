import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Calendar, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

const completionData = [
  { category: "Запланировано", value: 52, color: "#93c5fd" },
  { category: "Выполнено", value: 48, color: "#3b82f6" },
];

const problematicTasks = [
  { id: "TASK-042", name: "Интеграция платежного шлюза", assignee: "Анна Смирнова", reason: "Сложная задача назначена перегруженному участнику", severity: "high" },
  { id: "TASK-055", name: "Миграция базы данных", assignee: "Михаил Петров", reason: "Критическая задача назначена младшему разработчику", severity: "high" },
  { id: "TASK-063", name: "Оптимизация API", assignee: "Алексей Коваленко", reason: "Участник уже на пределе возможностей", severity: "medium" },
  { id: "TASK-071", name: "Редизайн интерфейса", assignee: "Ольга Морозова", reason: "Оценка 8ч, фактическая тенденция 12ч+", severity: "medium" },
];

const carryoverTasks = [
  { id: "TASK-038", name: "Рефакторинг аутентификации", points: 8, reason: "Недооценена сложность" },
  { id: "TASK-041", name: "Функция генерации отчетов", points: 5, reason: "Заблокировано внешней зависимостью" },
  { id: "TASK-049", name: "Тестирование производительности", points: 3, reason: "Низкий приоритет, отложено" },
];

export function SprintAnalysis() {
  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Анализ спринта</h2>
        <p className="text-sm text-gray-500 mt-1">Показатели текущего спринта и риски</p>
      </div>

      {/* Sprint Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">Спринт 6</h3>
          </div>
          <p className="text-sm text-gray-900 font-medium">8 апр - 22 апр, 2026</p>
          <p className="text-xs text-gray-500 mt-1">14 дней</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">Процент выполнения</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">92%</p>
          <p className="text-xs text-gray-500 mt-1">48 из 52 сторипойнтов</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <TrendingUp className="text-amber-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">Перенесенные задачи</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">3</p>
          <p className="text-xs text-gray-500 mt-1">16 сторипойнтов</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">Уровень риска</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">Средний</p>
          <p className="text-xs text-gray-500 mt-1">4 проблемные задачи</p>
        </div>
      </div>

      {/* Planned vs Completed Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Запланированная и выполненная работа</h3>
          <p className="text-sm text-gray-500 mt-1">Сравнение сторипойнтов для Спринта 6</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={completionData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={100} />
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

      {/* Sprint Completion Probability */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Вероятность завершения спринта</h3>
          <p className="text-sm text-gray-500 mt-1">Симуляция Монте-Карло на основе исторических данных</p>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Уверенность 50%</span>
              <span className="text-sm font-semibold text-gray-900">45 сторипойнтов</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div className="bg-green-500 h-3 rounded-full" style={{ width: "87%" }}></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Уверенность 80%</span>
              <span className="text-sm font-semibold text-gray-900">42 сторипойнта</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full" style={{ width: "81%" }}></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Уверенность 95%</span>
              <span className="text-sm font-semibold text-gray-900">38 сторипойнтов</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div className="bg-amber-500 h-3 rounded-full" style={{ width: "73%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Problematic Tasks */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Проблемные задачи</h3>
          <p className="text-sm text-gray-500 mt-1">Задачи с выявленными рисками</p>
        </div>
        <div className="divide-y divide-gray-200">
          {problematicTasks.map((task) => (
            <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
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
                  </div>
                  <p className="text-sm text-gray-900 mt-2">{task.name}</p>
                  <p className="text-sm text-gray-500 mt-1">Исполнитель: {task.assignee}</p>
                  <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 rounded-lg">
                    <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-900">{task.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Carryover Tasks */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Перенесенные задачи</h3>
          <p className="text-sm text-gray-500 mt-1">Задачи, переносимые в следующий спринт</p>
        </div>
        <div className="divide-y divide-gray-200">
          {carryoverTasks.map((task) => (
            <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{task.id}</span>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {task.points} SP
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 mt-1">{task.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Причина: {task.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
