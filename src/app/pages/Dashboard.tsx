import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Target, CheckCircle, AlertTriangle } from "lucide-react";

const velocityData = [
  { sprint: "Спринт 1", velocity: 42 },
  { sprint: "Спринт 2", velocity: 38 },
  { sprint: "Спринт 3", velocity: 45 },
  { sprint: "Спринт 4", velocity: 52 },
  { sprint: "Спринт 5", velocity: 48 },
  { sprint: "Спринт 6", velocity: 55 },
];

const planVsFactData = [
  { sprint: "Спринт 1", planned: 45, actual: 42 },
  { sprint: "Спринт 2", planned: 40, actual: 38 },
  { sprint: "Спринт 3", planned: 48, actual: 45 },
  { sprint: "Спринт 4", planned: 50, actual: 52 },
  { sprint: "Спринт 5", planned: 50, actual: 48 },
  { sprint: "Спринт 6", planned: 52, actual: 55 },
];

const complexityData = [
  { name: "Низкая", value: 45, color: "#10b981" },
  { name: "Средняя", value: 35, color: "#3b82f6" },
  { name: "Высокая", value: 20, color: "#f59e0b" },
];

export function Dashboard() {
  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Обзор</h2>
        <p className="text-sm text-gray-500 mt-1">Обзор показателей эффективности команды</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">+12%</span>
          </div>
          <h3 className="text-sm text-gray-500">Средняя производительность</h3>
          <p className="text-3xl font-semibold text-gray-900 mt-2">47,5</p>
          <p className="text-xs text-gray-500 mt-2">Сторипойнтов за спринт</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Target className="text-purple-600" size={20} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">+5%</span>
          </div>
          <h3 className="text-sm text-gray-500">Точность оценки</h3>
          <p className="text-3xl font-semibold text-gray-900 mt-2">87,3%</p>
          <p className="text-xs text-gray-500 mt-2">Соответствие плана и факта</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">+8%</span>
          </div>
          <h3 className="text-sm text-gray-500">Выполнение бэклога</h3>
          <p className="text-3xl font-semibold text-gray-900 mt-2">92,1%</p>
          <p className="text-xs text-gray-500 mt-2">Индекс BCI</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">Средний</span>
          </div>
          <h3 className="text-sm text-gray-500">Уровень риска</h3>
          <p className="text-3xl font-semibold text-gray-900 mt-2">3,2</p>
          <p className="text-xs text-gray-500 mt-2">Из 10</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Velocity Over Time */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Динамика производительности</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="sprint" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Line type="monotone" dataKey="velocity" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Plan vs Fact */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">План и факт</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={planVsFactData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="sprint" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="planned" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Task Distribution by Complexity */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Распределение задач по сложности</h3>
        <div className="flex items-center gap-12">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={complexityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {complexityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {complexityData.map((item) => (
              <div key={item.name} className="flex items-center gap-4">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.name} сложность</p>
                  <p className="text-sm text-gray-500">{item.value}% задач</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
