import { AlertCircle, TrendingUp, Users, Target, CheckCircle } from "lucide-react";
import { useProjectAnalytics } from "../model/useProjectAnalytics";

const iconByKind = {
  scope: Target,
  team: Users,
  risk: AlertCircle,
  calibration: TrendingUp,
  quality: CheckCircle,
};

const priorityLabel = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

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
  const { recommendations, projectName, isLoading, error, hasData } = useProjectAnalytics();
  const highPriority = recommendations.filter((item) => item.priority === "high");
  const mediumPriority = recommendations.filter((item) => item.priority === "medium");
  const lowPriority = recommendations.filter((item) => item.priority === "low");

  if (isLoading) {
    return <div className="p-8 text-sm text-gray-500">Загружаем рекомендации проекта...</div>;
  }

  if (error) {
    return <div className="p-8 text-sm text-red-600">Ошибка загрузки аналитики: {error}</div>;
  }

  if (!hasData) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-gray-900">Рекомендации</h2>
          <p className="mt-3 text-sm text-gray-500">
            Рекомендации появятся после первой загрузки Excel по проекту {projectName}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Рекомендации</h2>
        <p className="text-sm text-gray-500 mt-1">
          Рекомендации по проекту {projectName}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertCircle className="text-red-600" size={18} />
            </div>
            <h3 className="text-sm text-gray-500">Высокий приоритет</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{highPriority.length}</p>
          <p className="text-xs text-gray-500 mt-1">Лучше разобрать в первую очередь</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <TrendingUp className="text-amber-600" size={18} />
            </div>
            <h3 className="text-sm text-gray-500">Средний приоритет</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{mediumPriority.length}</p>
          <p className="text-xs text-gray-500 mt-1">Можно учесть при следующем планировании</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <CheckCircle className="text-blue-600" size={18} />
            </div>
            <h3 className="text-sm text-gray-500">Низкий приоритет</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{lowPriority.length}</p>
          <p className="text-xs text-gray-500 mt-1">Не требуют срочных действий</p>
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((recommendation) => {
          const Icon = iconByKind[recommendation.kind];
          const styles = getPriorityStyles(recommendation.priority);

          return (
            <div
              key={recommendation.id}
              className={`bg-white rounded-xl p-6 border-2 ${styles.border} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={styles.iconColor} size={24} />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3 gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">{recommendation.title}</h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${styles.badge}`}>
                      {priorityLabel[recommendation.priority]}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed mb-4">{recommendation.description}</p>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Обоснование</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{recommendation.reason}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {recommendation.metrics.map((metric) => (
                      <span
                        key={metric}
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
