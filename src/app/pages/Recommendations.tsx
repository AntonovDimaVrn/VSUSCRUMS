import { AlertCircle, TrendingUp, Users, Target, CheckCircle } from "lucide-react";

const recommendations = [
  {
    id: 1,
    priority: "high",
    title: "Сократить объем спринта на 15%",
    description: "Текущее планирование спринтов стабильно превышает возможности команды на 12-15%. Рекомендуется снизить планируемые сторипойнты с 52 до 44 за спринт.",
    reason: "По данным последних 6 спринтов: средняя производительность 47,5 SP, но средний план — 52 SP. Это приводит к 92% выполнения и повышенному стрессу.",
    metrics: ["Производительность: 47,5 SP", "Средний план: 52 SP", "Процент выполнения: 92%"],
    icon: Target,
    color: "red",
  },
  {
    id: 2,
    priority: "high",
    title: "Перераспределить нагрузку для Анны Смирновой и Алексея Коваленко",
    description: "Два участника команды стабильно работают сверх нормы (112% и 105%). Рекомендуется перераспределить 8-10 часов работы недогруженным участникам.",
    reason: "Анализ показывает: Анна Смирнова — 45ч из 40ч, Алексей Коваленко — 42ч из 40ч. При этом Ольга Морозова загружена на 63% (22ч из 35ч).",
    metrics: ["Анна Смирнова: 112% загрузки", "Алексей Коваленко: 105% загрузки", "Ольга Морозова: 63% загрузки"],
    icon: Users,
    color: "red",
  },
  {
    id: 3,
    priority: "high",
    title: "Не назначать сложные задачи младшим разработчикам",
    description: "Задачи высокой сложности, назначенные младшим разработчикам, выполняются на 67% против 94% у старших. Рекомендуется переназначить или работать в паре с наставником.",
    reason: "Анализ показывает: Михаил Петров (Junior) имеет 3 незавершенные сложные задачи за последние 2 спринта. При работе в паре успешность возрастает до 89%.",
    metrics: ["Успех младших на сложных задачах: 67%", "Успех старших: 94%", "Успех в паре: 89%"],
    icon: AlertCircle,
    color: "red",
  },
  {
    id: 4,
    priority: "medium",
    title: "Улучшить точность оценки UI-задач",
    description: "Задачи, связанные с UI, стабильно недооцениваются на 35%. Применяйте множитель 1,4x к оценкам дизайна и фронтенда.",
    reason: "Последние 4 спринта показывают: UI-задачи оцениваются в среднем на 5,2 часа, но фактически занимают 7,1 часа. Это наибольший разрыв среди всех типов задач.",
    metrics: ["UI оценка: 5,2ч средн.", "UI факт: 7,1ч средн.", "Разрыв: +36%"],
    icon: TrendingUp,
    color: "amber",
  },
  {
    id: 5,
    priority: "medium",
    title: "Увеличить участие QA в планировании спринта",
    description: "QA-инженер (Елена Сидорова) недогружена на 84%. Раннее участие QA может снизить дефекты после разработки на 25%.",
    reason: "Текущий процесс предполагает участие QA только в последние 30% спринта. Раннее вовлечение снижает переделки и улучшает метрики качества.",
    metrics: ["Загрузка QA: 84%", "Время участия QA: последние 30% спринта", "Потенциальное снижение дефектов: 25%"],
    icon: CheckCircle,
    color: "amber",
  },
  {
    id: 6,
    priority: "low",
    title: "Рассмотреть добавление буфера для внешних зависимостей",
    description: "Задачи с внешними зависимостями переносятся на 28% чаще. Добавьте буфер 2-3 дня или снизьте обязательства при наличии внешних зависимостей.",
    reason: "3 из последних 5 перенесенных задач содержали внешние зависимости (API, сторонние сервисы, дизайн-ассеты). Средняя задержка: 2,8 дня.",
    metrics: ["Перенос задач с завис.: 28%", "Средняя задержка: 2,8 дня", "Затронутые задачи: 18% спринта"],
    icon: AlertCircle,
    color: "blue",
  },
];

const getPriorityStyles = (priority: string) => {
  switch (priority) {
    case "high":
      return {
        badge: "bg-red-100 text-red-800",
        border: "border-red-200",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
      };
    case "medium":
      return {
        badge: "bg-amber-100 text-amber-800",
        border: "border-amber-200",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
      };
    default:
      return {
        badge: "bg-blue-100 text-blue-800",
        border: "border-blue-200",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
      };
  }
};

export function Recommendations() {
  const highPriority = recommendations.filter((r) => r.priority === "high");
  const mediumPriority = recommendations.filter((r) => r.priority === "medium");
  const lowPriority = recommendations.filter((r) => r.priority === "low");

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Рекомендации</h2>
        <p className="text-sm text-gray-500 mt-1">Аналитические рекомендации для планирования спринтов и оптимизации команды</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertCircle className="text-red-600" size={18} />
            </div>
            <h3 className="text-sm text-gray-500">Высокий приоритет</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{highPriority.length}</p>
          <p className="text-xs text-gray-500 mt-1">Требуются немедленные действия</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <TrendingUp className="text-amber-600" size={18} />
            </div>
            <h3 className="text-sm text-gray-500">Средний приоритет</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{mediumPriority.length}</p>
          <p className="text-xs text-gray-500 mt-1">Запланировать на следующий спринт</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <CheckCircle className="text-blue-600" size={18} />
            </div>
            <h3 className="text-sm text-gray-500">Низкий приоритет</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{lowPriority.length}</p>
          <p className="text-xs text-gray-500 mt-1">Рассмотреть в будущем</p>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.map((rec) => {
          const Icon = rec.icon;
          const styles = getPriorityStyles(rec.priority);

          return (
            <div
              key={rec.id}
              className={`bg-white rounded-xl p-6 border-2 ${styles.border} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={styles.iconColor} size={24} />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${styles.badge} uppercase`}>
                      {rec.priority}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed mb-4">{rec.description}</p>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Обоснование</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{rec.reason}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {rec.metrics.map((metric, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700"
                      >
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
