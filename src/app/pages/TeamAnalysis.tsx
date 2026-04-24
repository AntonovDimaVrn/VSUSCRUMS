import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users, AlertCircle } from "lucide-react";

const teamMembers = [
  { name: "Иван Иванов", role: "Старший разработчик", level: "Senior", workload: 38, capacity: 40, status: "optimal" },
  { name: "Анна Смирнова", role: "Тимлид", level: "Lead", workload: 45, capacity: 40, status: "overloaded" },
  { name: "Михаил Петров", role: "Младший разработчик", level: "Junior", workload: 28, capacity: 35, status: "optimal" },
  { name: "Елена Сидорова", role: "QA-инженер", level: "Middle", workload: 32, capacity: 38, status: "optimal" },
  { name: "Алексей Коваленко", role: "Разработчик", level: "Middle", workload: 42, capacity: 40, status: "overloaded" },
  { name: "Ольга Морозова", role: "Дизайнер", level: "Senior", workload: 22, capacity: 35, status: "underutilized" },
];

const loadDistributionData = [
  { name: "Иван Иванов", workload: 38, capacity: 40 },
  { name: "Анна Смирнова", workload: 45, capacity: 40 },
  { name: "Михаил Петров", workload: 28, capacity: 35 },
  { name: "Елена Сидорова", workload: 32, capacity: 38 },
  { name: "Алексей Коваленко", workload: 42, capacity: 40 },
  { name: "Ольга Морозова", workload: 22, capacity: 35 },
];

const heatmapData = [
  { role: "Старший разработчик", low: 12, medium: 18, high: 8 },
  { role: "Тимлид", low: 8, medium: 15, high: 12 },
  { role: "Младший разработчик", low: 22, medium: 6, high: 0 },
  { role: "QA-инженер", low: 15, medium: 14, high: 3 },
  { role: "Разработчик", low: 18, medium: 20, high: 4 },
  { role: "Дизайнер", low: 20, medium: 2, high: 0 },
];

export function TeamAnalysis() {
  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Анализ команды</h2>
        <p className="text-sm text-gray-500 mt-1">Нагрузка участников команды и распределение задач</p>
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="text-blue-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">Всего участников</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">6</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertCircle className="text-amber-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">Перегружено участников</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">2</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="text-green-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">Средняя загруженность</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">89%</p>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Участники команды</h3>
          <p className="text-sm text-gray-500 mt-1">Детальная информация о нагрузке</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Имя
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Уровень
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Нагрузка
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <tr key={member.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-blue-700">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                      {member.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                        <div
                          className={`h-2 rounded-full ${
                            member.status === "overloaded"
                              ? "bg-red-500"
                              : member.status === "underutilized"
                              ? "bg-blue-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${(member.workload / member.capacity) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {member.workload}/{member.capacity}h
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        member.status === "overloaded"
                          ? "bg-red-100 text-red-800"
                          : member.status === "underutilized"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {member.status === "overloaded"
                        ? "Перегружен"
                        : member.status === "underutilized"
                        ? "Недогружен"
                        : "Оптимально"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load Distribution Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Распределение нагрузки</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={loadDistributionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
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
            <Bar dataKey="workload" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="capacity" fill="#93c5fd" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Role vs Task Complexity Heatmap */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Роли и сложность задач</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Роль</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Низкая сложность</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Средняя сложность</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Высокая сложность</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {heatmapData.map((row) => (
                <tr key={row.role}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.role}</td>
                  <td className="px-6 py-4 text-center">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-10 rounded text-sm font-medium ${
                        row.low > 15
                          ? "bg-green-500 text-white"
                          : row.low > 10
                          ? "bg-green-300 text-green-900"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {row.low}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-10 rounded text-sm font-medium ${
                        row.medium > 15
                          ? "bg-blue-500 text-white"
                          : row.medium > 10
                          ? "bg-blue-300 text-blue-900"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {row.medium}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-10 rounded text-sm font-medium ${
                        row.high > 10
                          ? "bg-amber-500 text-white"
                          : row.high > 5
                          ? "bg-amber-300 text-amber-900"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {row.high}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center gap-6 text-xs text-gray-500">
          <span>Интенсивность:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100"></div>
            <span>Низкая</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-300"></div>
            <span>Средняя</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span>Высокая</span>
          </div>
        </div>
      </div>
    </div>
  );
}
