import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users, AlertCircle, TrendingUp } from "lucide-react";
import { useProjectAnalytics } from "../model/useProjectAnalytics";

const qualificationLabel = {
  junior: "младший специалист",
  middle: "основной специалист",
  senior: "ведущий специалист",
  analyst: "аналитик",
  pm: "руководитель проекта",
};

function formatWholeHours(value: number) {
  return Math.round(value).toLocaleString("ru-RU");
}

export function TeamAnalysis() {
  const { team, projectName, isLoading, error, hasData } = useProjectAnalytics();

  if (isLoading) {
    return <div className="p-8 text-sm text-gray-500">Загружаем анализ команды...</div>;
  }

  if (error) {
    return <div className="p-8 text-sm text-red-600">Ошибка загрузки аналитики: {error}</div>;
  }

  if (!hasData) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-gray-900">Анализ команды</h2>
          <p className="mt-3 text-sm text-gray-500">
            Командная аналитика появится после первой успешной загрузки Excel-файла для проекта{" "}
            {projectName}.
          </p>
        </div>
      </div>
    );
  }

  const averageEi = (
    team.members.reduce((sum, member) => sum + member.weightedEfficiency, 0) / team.members.length
  ).toFixed(2);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Анализ команды</h2>
        <p className="text-sm text-gray-500 mt-1">
          Нагрузка, роль и квалификация участников проекта {projectName}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-4 md:grid-cols-2">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="text-blue-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">Всего участников</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{team.totalMembers}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertCircle className="text-amber-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">Перегружено участников</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{team.overloadedCount}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">Средняя загруженность</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{team.averageUtilization}%</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
            <h3 className="text-sm text-gray-500">Средний EI по участникам</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{averageEi}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Участники команды</h3>
          <p className="text-sm text-gray-500 mt-1">
            Нагрузка по часам, роль и квалификация в текущем спринте
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] table-fixed">
            <colgroup>
              <col className="w-[220px]" />
              <col className="w-[160px]" />
              <col className="w-[170px]" />
              <col className="w-[320px]" />
              <col className="w-[90px]" />
              <col className="w-[110px]" />
              <col className="w-[150px]" />
            </colgroup>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Имя
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Квалификация
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Нагрузка
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P в срок
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {team.members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-blue-700">
                          {member.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                      {qualificationLabel[member.qualification]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full space-y-2 overflow-hidden">
                      <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
                        <span>Загрузка</span>
                        <span className="shrink-0">
                          {formatWholeHours(member.workload)}/{formatWholeHours(member.capacity)} ч
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${
                            member.status === "overloaded"
                              ? "bg-red-500"
                              : member.status === "underutilized"
                              ? "bg-blue-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(member.utilizationPercent, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {member.utilizationPercent}% от доступной ёмкости
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {member.weightedEfficiency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {member.averageProbability}%
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

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Распределение нагрузки</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={team.loadDistribution}>
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
            <Bar dataKey="workload" name="Факт, ч" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="capacity" name="Доступность, ч" fill="#93c5fd" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Роли и классы сложности</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Роль</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">S</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">M</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">L</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">XL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {team.complexityByRole.map((row) => (
                <tr key={row.role}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.role}</td>
                  {(["S", "M", "L", "XL"] as const).map((key) => (
                    <td key={key} className="px-6 py-4 text-center">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-10 rounded text-sm font-medium ${
                          row[key] >= 3
                            ? "bg-blue-500 text-white"
                            : row[key] >= 2
                            ? "bg-blue-300 text-blue-900"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {row[key]}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center gap-6 text-xs text-gray-500">
          <span>Интенсивность участия:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100"></div>
            <span>1 заявка</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-300"></div>
            <span>2 заявки</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span>3+ заявок</span>
          </div>
        </div>
      </div>
    </div>
  );
}
