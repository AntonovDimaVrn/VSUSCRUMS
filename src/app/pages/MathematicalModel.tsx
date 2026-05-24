import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BackendApiError,
  createProjectModelVersion,
  ensureBackendProjectId,
  getProjectModel,
  getProjectTaskDetails,
  listProjectModelHistory,
  restoreProjectModelVersion,
  type BackendModelConfigVersion,
  type BackendModelHistoryItem,
  type BackendTaskDetails,
} from "../api/backend";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useProjects } from "../context/ProjectsContext";
import {
  buildFormulaPreviewContext,
  evaluateFormulaPreview,
  formulaDefinitions,
  formulaFunctionTokens,
  formulaOperatorTokens,
  formulaVariableDefinitions,
  formatPreviewValue,
  getReferencedVariableTokens,
  getUnknownFormulaTokens,
  type FormulaKey,
} from "../model/formulaWorkbench";

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

export function MathematicalModel() {
  const { selectedProject, linkProjectToBackend } = useProjects();
  const formulaTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [backendProjectId, setBackendProjectId] = useState<number | null>(selectedProject?.backendId ?? null);
  const [model, setModel] = useState<BackendModelConfigVersion | null>(null);
  const [history, setHistory] = useState<BackendModelHistoryItem[]>([]);
  const [taskDetails, setTaskDetails] = useState<BackendTaskDetails | null>(null);
  const [draft, setDraft] = useState<BackendModelConfigVersion | null>(null);
  const [changeNote, setChangeNote] = useState("");
  const [selectedFormulaKey, setSelectedFormulaKey] = useState<FormulaKey | "">("");
  const [selectedPreviewTaskId, setSelectedPreviewTaskId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const orderedAlphaKeys = useMemo(
    () => Object.keys(draft?.alpha_scale ?? {}),
    [draft?.alpha_scale],
  );

  const orderedWorkNormKeys = useMemo(
    () => Object.keys(draft?.work_norms ?? {}),
    [draft?.work_norms],
  );

  const orderedFormulaKeys = useMemo(
    () => Object.keys(draft?.formulas ?? {}) as FormulaKey[],
    [draft?.formulas],
  );

  useEffect(() => {
    if (orderedFormulaKeys.length === 0) {
      setSelectedFormulaKey("");
      return;
    }

    setSelectedFormulaKey((current) => {
      if (current && orderedFormulaKeys.includes(current)) {
        return current;
      }
      return orderedFormulaKeys[0];
    });
  }, [orderedFormulaKeys]);

  useEffect(() => {
    const previewTasks = taskDetails?.tasks ?? [];
    if (previewTasks.length === 0) {
      setSelectedPreviewTaskId("");
      return;
    }

    setSelectedPreviewTaskId((current) => {
      if (current && previewTasks.some((task) => task.id === current)) {
        return current;
      }
      return previewTasks[0]?.id ?? "";
    });
  }, [taskDetails?.tasks]);

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
        await refreshWorkspace(ensuredProjectId, isCancelled);
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

    const refreshWorkspace = async (projectId: number, cancelled = false) => {
      const [activeModel, historyItems, taskPayload] = await Promise.all([
        getProjectModel(projectId),
        listProjectModelHistory(projectId),
        getProjectTaskDetails(projectId),
      ]);

      if (cancelled) {
        return;
      }

      setModel(activeModel);
      setDraft(activeModel);
      setHistory(historyItems);
      setTaskDetails(taskPayload);
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [linkProjectToBackend, selectedProject]);

  const activeFormulaKey = selectedFormulaKey || orderedFormulaKeys[0] || null;
  const activeFormulaDefinition = activeFormulaKey ? formulaDefinitions[activeFormulaKey] : null;
  const activeFormulaExpression = activeFormulaKey && draft ? draft.formulas[activeFormulaKey] : "";

  const previewTask = useMemo(
    () => (taskDetails?.tasks ?? []).find((task) => task.id === selectedPreviewTaskId) ?? null,
    [selectedPreviewTaskId, taskDetails?.tasks],
  );

  const previewContext = useMemo(
    () => buildFormulaPreviewContext(previewTask, taskDetails?.tasks ?? []),
    [previewTask, taskDetails?.tasks],
  );

  const referencedVariableTokens = useMemo(
    () => getReferencedVariableTokens(activeFormulaExpression),
    [activeFormulaExpression],
  );

  const helperVariableTokens = useMemo(() => {
    const orderedTokens = activeFormulaDefinition?.variableTokens ?? [];
    return Array.from(new Set([...orderedTokens, ...referencedVariableTokens]));
  }, [activeFormulaDefinition?.variableTokens, referencedVariableTokens]);

  const unknownTokens = useMemo(
    () => getUnknownFormulaTokens(activeFormulaExpression),
    [activeFormulaExpression],
  );

  const previewResult = useMemo(() => {
    if (!previewContext || !activeFormulaExpression) {
      return { result: null, error: "" };
    }
    return evaluateFormulaPreview(activeFormulaExpression, previewContext);
  }, [activeFormulaExpression, previewContext]);

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

  const handleFormulaChange = (key: FormulaKey, value: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      formulas: {
        ...draft.formulas,
        [key]: value,
      },
    });
  };

  const refreshWorkspace = async (projectId: number) => {
    const [activeModel, historyItems, taskPayload] = await Promise.all([
      getProjectModel(projectId),
      listProjectModelHistory(projectId),
      getProjectTaskDetails(projectId),
    ]);
    setModel(activeModel);
    setDraft(activeModel);
    setHistory(historyItems);
    setTaskDetails(taskPayload);
  };

  const insertIntoFormula = (snippet: string, cursorOffset = 0) => {
    if (!draft || !activeFormulaKey) return;

    const currentValue = draft.formulas[activeFormulaKey];
    const textarea = formulaTextareaRef.current;
    if (!textarea) {
      handleFormulaChange(activeFormulaKey, `${currentValue}${snippet}`);
      return;
    }

    const start = textarea.selectionStart ?? currentValue.length;
    const end = textarea.selectionEnd ?? currentValue.length;
    const nextValue = `${currentValue.slice(0, start)}${snippet}${currentValue.slice(end)}`;
    const nextCursor = start + snippet.length + cursorOffset;

    handleFormulaChange(activeFormulaKey, nextValue);

    requestAnimationFrame(() => {
      formulaTextareaRef.current?.focus();
      formulaTextareaRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
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
      await refreshWorkspace(backendProjectId);
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
      await refreshWorkspace(backendProjectId);
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
          создаёт новую версию, попадает в историю и сразу влияет на расчёт метрик после загрузки
          данных.
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
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Конструктор формул</h3>
              <p className="mt-1 text-sm text-gray-500">
                Backend использует эти выражения напрямую. Ниже можно посмотреть допустимые
                переменные, вставить их в формулу и увидеть живой preview на реальной задаче.
              </p>
            </div>

            <div className="mt-5 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-3">
                {orderedFormulaKeys.map((key) => {
                  const definition = formulaDefinitions[key];
                  const isActive = key === activeFormulaKey;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedFormulaKey(key)}
                      className={`w-full rounded-xl border px-4 py-4 text-left transition-colors ${
                        isActive
                          ? "border-blue-200 bg-blue-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {definition.symbol}
                          </div>
                          <div className="mt-1 text-sm text-gray-700">{definition.label}</div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            definition.scope === "task"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-violet-100 text-violet-800"
                          }`}
                        >
                          {definition.scope === "task" ? "по задаче" : "по спринту"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">{definition.description}</p>
                    </button>
                  );
                })}
              </div>

              {activeFormulaDefinition && activeFormulaKey ? (
                <div className="space-y-6 rounded-2xl border border-gray-200 bg-gray-50/60 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-xl font-semibold text-gray-900">
                          {activeFormulaDefinition.symbol}
                        </h4>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            activeFormulaDefinition.scope === "task"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-violet-100 text-violet-800"
                          }`}
                        >
                          {activeFormulaDefinition.scope === "task"
                            ? "Расчёт по задаче"
                            : "Расчёт по спринту"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{activeFormulaDefinition.description}</p>
                      <p className="mt-1 text-xs text-gray-500">{activeFormulaDefinition.helperText}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`formula-${activeFormulaKey}`}>Формула</Label>
                    <Textarea
                      ref={formulaTextareaRef}
                      id={`formula-${activeFormulaKey}`}
                      value={activeFormulaExpression}
                      onChange={(event) => handleFormulaChange(activeFormulaKey, event.target.value)}
                      className="min-h-28 bg-white font-mono text-sm"
                    />
                  </div>

                  {unknownTokens.length > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      В формуле есть неизвестные идентификаторы: {unknownTokens.join(", ")}.
                    </div>
                  )}

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-5">
                      <TokenSection title="Переменные" description="Нажми, чтобы вставить переменную в текущую позицию курсора.">
                        <div className="flex flex-wrap gap-2">
                          {helperVariableTokens.map((token) => (
                            <TokenButton
                              key={token}
                              label={token}
                              onClick={() => insertIntoFormula(token)}
                            />
                          ))}
                        </div>
                      </TokenSection>

                      <TokenSection title="Операторы" description="Базовые математические операции для сборки выражения.">
                        <div className="flex flex-wrap gap-2">
                          {formulaOperatorTokens.map((token) => (
                            <TokenButton
                              key={token.label}
                              label={token.label}
                              onClick={() => insertIntoFormula(token.value)}
                            />
                          ))}
                        </div>
                      </TokenSection>

                      <TokenSection title="Функции" description="Разрешённые функции preview и backend-движка.">
                        <div className="flex flex-wrap gap-2">
                          {formulaFunctionTokens.map((token) => (
                            <TokenButton
                              key={token.label}
                              label={token.label}
                              onClick={() => insertIntoFormula(token.value, token.cursorOffset)}
                            />
                          ))}
                        </div>
                      </TokenSection>
                    </div>

                    <div className="space-y-5">
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900">Живой preview</h5>
                            <p className="mt-1 text-xs text-gray-500">
                              Подстановка идёт по реальной задаче проекта.
                            </p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <select
                              value={selectedPreviewTaskId}
                              onChange={(event) => setSelectedPreviewTaskId(event.target.value)}
                              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              disabled={!taskDetails?.tasks.length}
                            >
                              {(taskDetails?.tasks ?? []).map((task) => (
                                <option key={task.id} value={task.id}>
                                  {task.id} · {task.sprintName}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {previewTask && previewContext ? (
                          <div className="mt-4 space-y-4">
                            <div className="rounded-xl bg-gray-50 p-4">
                              <div className="text-sm font-medium text-gray-900">
                                {previewTask.id} · {previewTask.title}
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                {previewTask.sprintName} · {previewTask.storyPoints} SP · статус {previewTask.status}
                              </div>
                            </div>

                            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                              <div className="text-xs font-medium uppercase tracking-wide text-blue-700">
                                Результат preview
                              </div>
                              {previewResult.error ? (
                                <p className="mt-2 text-sm text-red-700">{previewResult.error}</p>
                              ) : (
                                <p className="mt-2 text-2xl font-semibold text-blue-900">
                                  {previewResult.result === null
                                    ? "Нет данных"
                                    : formatPreviewValue(previewResult.result)}
                                </p>
                              )}
                            </div>

                            <div>
                              <div className="text-sm font-medium text-gray-900">Подставленные значения</div>
                              <div className="mt-3 space-y-2">
                                {helperVariableTokens.map((token) => {
                                  const definition = formulaVariableDefinitions[token];
                                  const value = previewContext[token];
                                  return (
                                    <div
                                      key={token}
                                      className="rounded-lg border border-gray-200 bg-white p-3"
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm font-medium text-gray-900">{token}</div>
                                        {value !== undefined && (
                                          <div className="font-mono text-xs text-blue-700">
                                            {formatPreviewValue(value)}
                                          </div>
                                        )}
                                      </div>
                                      <div className="mt-1 text-xs text-gray-500">
                                        {definition?.description ?? "Переменная используется в текущей формуле."}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            Живой preview появится после загрузки Excel-данных в проект.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <h5 className="text-sm font-semibold text-gray-900">Справочник переменных</h5>
                    <p className="mt-1 text-xs text-gray-500">
                      Здесь видно, какие переменные допустимы именно для выбранной формулы.
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {helperVariableTokens.map((token) => {
                        const definition = formulaVariableDefinitions[token];
                        return (
                          <button
                            key={token}
                            type="button"
                            onClick={() => insertIntoFormula(token)}
                            className="rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-mono text-sm font-semibold text-gray-900">{token}</div>
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-gray-600">
                                {definition?.scope === "sprint"
                                  ? "sprint"
                                  : definition?.scope === "shared"
                                  ? "shared"
                                  : "task"}
                              </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-800">{definition?.label ?? token}</div>
                            <div className="mt-1 text-xs text-gray-500">
                              {definition?.description ?? "Описание переменной пока не задано."}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
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
              <span className="text-sm text-gray-500">Активна версия #{model.version_number}</span>
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
              <p>Проект: {selectedProject.name}</p>
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
                      <div className="text-sm font-medium text-gray-900">Версия #{item.version_number}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleString("ru-RU")}
                      </div>
                      <div className="text-sm text-gray-600">{item.change_note || "Без комментария"}</div>
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

function TokenSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function TokenButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-gray-300 bg-white px-3 py-1.5 font-mono text-xs text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
    >
      {label}
    </button>
  );
}
