import { useEffect, useMemo, useState } from "react";
import {
  BackendApiError,
  createProjectModelVersion,
  ensureBackendProjectId,
  getProjectModel,
  listProjectModelHistory,
  restoreProjectModelVersion,
  type BackendModelConfigVersion,
  type BackendModelHistoryItem,
} from "../api/backend";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useProjects } from "../context/ProjectsContext";

const coefficientLabels: Record<string, string> = {
  junior: "alpha(junior)",
  middle: "alpha(middle)",
  senior: "alpha(senior)",
  analyst: "alpha(analyst)",
  pm: "alpha(pm)",
  S: "w(S)",
  M: "w(M)",
  L: "w(L)",
  XL: "w(XL)",
};

const formulaLabels: Record<string, string> = {
  weighted_qualification: "Q_i",
  communication_factor: "f(M_i)",
  optimal_time: "Topt_i",
  efficiency_index: "EI_i",
  deviation_percent: "δ_i",
  on_time_probability: "P(Tfact ≤ Tplan)",
  backlog_completion_index: "BCI_sprint",
  sprint_efficiency_index: "EI_sprint",
};

export function MathematicalModel() {
  const { selectedProject, linkProjectToBackend } = useProjects();
  const [backendProjectId, setBackendProjectId] = useState<number | null>(selectedProject?.backendId ?? null);
  const [model, setModel] = useState<BackendModelConfigVersion | null>(null);
  const [history, setHistory] = useState<BackendModelHistoryItem[]>([]);
  const [draft, setDraft] = useState<BackendModelConfigVersion | null>(null);
  const [changeNote, setChangeNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      if (!selectedProject) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      try {
        const ensuredProjectId = await ensureBackendProjectId(selectedProject, linkProjectToBackend);
        if (isCancelled) return;
        setBackendProjectId(ensuredProjectId);

        const [activeModel, historyItems] = await Promise.all([
          getProjectModel(ensuredProjectId),
          listProjectModelHistory(ensuredProjectId),
        ]);

        if (isCancelled) return;

        setModel(activeModel);
        setDraft(activeModel);
        setHistory(historyItems);
      } catch (nextError) {
        if (!isCancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Не удалось загрузить конфигурацию математической модели.",
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

  const orderedAlphaKeys = useMemo(
    () => Object.keys(draft?.alpha_scale ?? {}),
    [draft?.alpha_scale],
  );

  const orderedWorkNormKeys = useMemo(
    () => Object.keys(draft?.work_norms ?? {}),
    [draft?.work_norms],
  );

  const orderedFormulaKeys = useMemo(
    () => Object.keys(draft?.formulas ?? {}),
    [draft?.formulas],
  );

  const handleAlphaChange = (key: string, value: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      alpha_scale: {
        ...draft.alpha_scale,
        [key]: Number(value),
      },
    });
  };

  const handleWorkNormChange = (key: string, value: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      work_norms: {
        ...draft.work_norms,
        [key]: Number(value),
      },
    });
  };

  const handleFormulaChange = (key: string, value: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      formulas: {
        ...draft.formulas,
        [key]: value,
      },
    });
  };

  const refreshModel = async (projectId: number) => {
    const [activeModel, historyItems] = await Promise.all([
      getProjectModel(projectId),
      listProjectModelHistory(projectId),
    ]);
    setModel(activeModel);
    setDraft(activeModel);
    setHistory(historyItems);
  };

  const handleSave = async () => {
    if (!backendProjectId || !draft) return;

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      await createProjectModelVersion(backendProjectId, {
        alpha_scale: draft.alpha_scale,
        beta: draft.beta,
        work_norms: draft.work_norms,
        formulas: draft.formulas,
        change_note: changeNote.trim() || "Обновление математической модели проекта.",
      });
      await refreshModel(backendProjectId);
      window.dispatchEvent(
        new CustomEvent("project-analytics-refresh", {
          detail: { projectId: selectedProject?.id },
        }),
      );
      setChangeNote("");
      setSuccessMessage("Новая версия модели сохранена, и аналитика проекта пересчитана.");
    } catch (nextError) {
      setError(
        nextError instanceof BackendApiError
          ? nextError.message
          : "Не удалось сохранить новую версию модели.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = async (versionId: number) => {
    if (!backendProjectId) return;

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      await restoreProjectModelVersion(backendProjectId, versionId);
      await refreshModel(backendProjectId);
      window.dispatchEvent(
        new CustomEvent("project-analytics-refresh", {
          detail: { projectId: selectedProject?.id },
        }),
      );
      setSuccessMessage("Предыдущая версия модели восстановлена как новая активная конфигурация.");
    } catch (nextError) {
      setError(
        nextError instanceof BackendApiError
          ? nextError.message
          : "Не удалось восстановить выбранную версию модели.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-sm text-gray-500">Загружаем математическую модель проекта...</div>;
  }

  if (!selectedProject) {
    return <div className="p-8 text-sm text-gray-500">Сначала выберите проект.</div>;
  }

  if (error && !draft) {
    return <div className="p-8 text-sm text-red-600">Ошибка: {error}</div>;
  }

  if (!draft || !model) {
    return <div className="p-8 text-sm text-gray-500">Модель проекта пока недоступна.</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Математическая модель</h2>
        <p className="mt-1 text-sm text-gray-500">
          Настраивайте формулы и коэффициенты проекта {selectedProject.name}. Каждое сохранение
          создаёт новую версию и сразу влияет на расчёт метрик после загрузки данных.
        </p>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">Коэффициенты производительности</h3>
            <p className="mt-1 text-sm text-gray-500">
              Эти коэффициенты участвуют в расчёте взвешенной квалификации команды задачи.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {orderedAlphaKeys.map((key) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`alpha-${key}`}>{coefficientLabels[key] ?? key}</Label>
                  <Input
                    id={`alpha-${key}`}
                    type="number"
                    step="0.01"
                    value={draft.alpha_scale[key]}
                    onChange={(event) => handleAlphaChange(key, event.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">Нормативы и β</h3>
            <p className="mt-1 text-sm text-gray-500">
              Здесь регулируются коммуникационные потери и базовая трудоёмкость Story Points по
              классам сложности.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="beta">β Брукса</Label>
                <Input
                  id="beta"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={draft.beta}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      beta: Number(event.target.value),
                    })
                  }
                />
              </div>
              {orderedWorkNormKeys.map((key) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`norm-${key}`}>{coefficientLabels[key] ?? key}</Label>
                  <Input
                    id={`norm-${key}`}
                    type="number"
                    step="0.01"
                    value={draft.work_norms[key]}
                    onChange={(event) => handleWorkNormChange(key, event.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">Редактируемые формулы</h3>
            <p className="mt-1 text-sm text-gray-500">
              Эти выражения backend использует напрямую при расчёте метрик проекта.
            </p>
            <div className="mt-5 space-y-5">
              {orderedFormulaKeys.map((key) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`formula-${key}`}>{formulaLabels[key] ?? key}</Label>
                  <Textarea
                    id={`formula-${key}`}
                    value={draft.formulas[key]}
                    onChange={(event) => handleFormulaChange(key, event.target.value)}
                    className="min-h-20 font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="space-y-2">
              <Label htmlFor="change-note">Комментарий к новой версии</Label>
              <Textarea
                id="change-note"
                value={changeNote}
                onChange={(event) => setChangeNote(event.target.value)}
                placeholder="Например: повысили beta и скорректировали w(L) после новых sprint-данных."
                className="min-h-24"
              />
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                {isSaving ? "Сохраняем..." : "Сохранить новую версию"}
              </Button>
              <span className="text-sm text-gray-500">
                Активна версия #{model.version_number}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">Активная конфигурация</h3>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <p>Версия: #{model.version_number}</p>
              <p>Создана: {new Date(model.created_at).toLocaleString("ru-RU")}</p>
              <p>Комментарий: {model.change_note || "Без комментария"}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">История версий</h3>
            <p className="mt-1 text-sm text-gray-500">
              Любую предыдущую версию можно восстановить как новую активную конфигурацию.
            </p>
            <div className="mt-5 space-y-3">
              {history.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900">
                        Версия #{item.version_number}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleString("ru-RU")}
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.change_note || "Без комментария"}
                      </div>
                    </div>
                    {item.is_active ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                        Активна
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => void handleRestore(item.id)}
                        disabled={isSaving}
                      >
                        Восстановить
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
