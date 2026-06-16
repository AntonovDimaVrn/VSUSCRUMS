import { useEffect, useMemo, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Calendar,
  FolderPlus,
  Database,
} from "lucide-react";
import { useProjects } from "../context/ProjectsContext";
import {
  BackendApiError,
  IMPORT_TEMPLATE_URL,
  createBackendProject,
  ensureBackendProjectId,
  listBackendProjects,
  listProjectUploads,
  mapBackendUploadsToRecords,
  uploadProjectExcel,
} from "../api/backend";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useProjectAnalytics } from "../model/useProjectAnalytics";

export function DataUpload() {
  const {
    projects,
    selectedProject,
    selectedProjectId,
    selectProject,
    createProject,
    linkProjectToBackend,
    replaceProjectUploads,
    syncProjectsFromBackend,
    uploads,
  } = useProjects();
  const {
    dashboard,
    hasData,
    isLoading: isAnalyticsLoading,
    previewRows,
    uploadFields,
  } = useProjectAnalytics();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [targetProjectId, setTargetProjectId] = useState(selectedProjectId);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [projectError, setProjectError] = useState("");
  const [projectSuccessMessage, setProjectSuccessMessage] = useState("");
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [lastUploadedFile, setLastUploadedFile] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  useEffect(() => {
    setTargetProjectId(selectedProjectId);
  }, [selectedProjectId]);

  const selectedTargetProject = useMemo(
    () => projects.find((project) => project.id === targetProjectId) ?? selectedProject,
    [projects, selectedProject, targetProjectId],
  );

  const projectUploads = useMemo(
    () => uploads.filter((item) => item.projectId === targetProjectId),
    [targetProjectId, uploads],
  );

  const latestProjectUpload = projectUploads[0];

  useEffect(() => {
    if (!selectedTargetProject?.backendId) return;

    let isCancelled = false;

    const loadProjectUploads = async () => {
      setIsHistoryLoading(true);

      try {
        const backendUploads = await listProjectUploads(selectedTargetProject.backendId!);
        if (isCancelled) return;
        replaceProjectUploads(
          selectedTargetProject.id,
          mapBackendUploadsToRecords(selectedTargetProject.id, backendUploads),
        );
      } catch {
        if (!isCancelled && uploadStatus === "idle") {
          setUploadErrorMessage(
            "Не удалось загрузить историю импортов с сервера. Проверьте localhost:8000.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsHistoryLoading(false);
        }
      }
    };

    void loadProjectUploads();

    return () => {
      isCancelled = true;
    };
  }, [replaceProjectUploads, selectedTargetProject, uploadStatus]);

  const ensureBackendProject = async () => {
    if (!selectedTargetProject) {
      throw new Error("Сначала выберите проект для импорта.");
    }
    return ensureBackendProjectId(selectedTargetProject, linkProjectToBackend);
  };

  const handleUpload = async (file: File) => {
    if (!targetProjectId || !selectedTargetProject) {
      setUploadErrorMessage("Сначала выберите проект для импорта, затем повторите загрузку файла.");
      setUploadStatus("error");
      return;
    }

    setUploadStatus("uploading");
    setUploadErrorMessage("");

    try {
      const backendProjectId = await ensureBackendProject();
      await uploadProjectExcel(backendProjectId, file);
      const backendUploads = await listProjectUploads(backendProjectId);

      replaceProjectUploads(
        selectedTargetProject.id,
        mapBackendUploadsToRecords(selectedTargetProject.id, backendUploads),
      );
      selectProject(targetProjectId);
      window.dispatchEvent(
        new CustomEvent("project-analytics-refresh", {
          detail: { projectId: selectedTargetProject.id },
        }),
      );
      setLastUploadedFile(file.name);
      setUploadStatus("success");
    } catch (error) {
      const message =
        error instanceof BackendApiError
          ? error.message
          : "Не удалось загрузить файл. Проверьте сервер и формат Excel-шаблона.";
      setUploadErrorMessage(message);
      setUploadStatus("error");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleUpload(e.target.files[0]);
      e.target.value = "";
    }
  };

  const handleCreateProject = async () => {
    const trimmedName = newProjectName.trim();
    if (!trimmedName) {
      setProjectError("Введите название проекта.");
      return;
    }

    setIsCreatingProject(true);
    setProjectError("");
    setProjectSuccessMessage("");

    const existingLocalProject = projects.find(
      (project) => project.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (existingLocalProject) {
      setTargetProjectId(existingLocalProject.id);
      selectProject(existingLocalProject.id);
      setProjectSuccessMessage("Проект уже есть в списке и выбран для загрузки Excel.");
      setIsCreatingProject(false);
      return;
    }

    try {
      const backendProject = await createBackendProject({
        name: trimmedName,
        description: newProjectDescription.trim() || "Новый проект без описания.",
      });

      const project = createProject({
        name: backendProject.name,
        description: backendProject.description || newProjectDescription,
        backendId: backendProject.id,
      });
      setTargetProjectId(project.id);
      selectProject(project.id);
      await syncProjectsFromBackend();
      setNewProjectName("");
      setNewProjectDescription("");
      setProjectSuccessMessage("Проект создан и выбран для загрузки Excel.");
    } catch (error) {
      if (error instanceof BackendApiError && error.status === 409) {
        try {
          const backendProjects = await listBackendProjects();
          const existingProject = backendProjects.find(
            (item) => item.name.trim().toLowerCase() === trimmedName.toLowerCase(),
          );
          if (existingProject) {
            const project = createProject({
              name: existingProject.name,
              description: existingProject.description || newProjectDescription,
              backendId: existingProject.id,
            });
            linkProjectToBackend(project.id, existingProject.id);
            setTargetProjectId(project.id);
            selectProject(project.id);
            await syncProjectsFromBackend();
            setNewProjectName("");
            setNewProjectDescription("");
            setProjectSuccessMessage("Проект уже был на сервере, он добавлен в список и выбран.");
          } else {
            setProjectError("Сервер сообщил, что проект уже существует, но не вернул его в списке.");
          }
        } catch {
          setProjectError("Проект уже существует, но список проектов с сервера сейчас не загрузился.");
        }
      } else {
        setProjectError(
          error instanceof Error
            ? error.message
            : "Не удалось создать проект. Проверьте, что сервер доступен на localhost:8000.",
        );
      }
    } finally {
      setIsCreatingProject(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Загрузка Excel-файла</h2>
        <p className="text-sm text-gray-500 mt-1">
          Импорт Excel-файла для расчёта трудозатрат, EI и рекомендаций.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Database className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Данные для анализа</h3>
              <p className="text-sm text-gray-500 mt-1">
                Выберите проект, в который нужно загрузить Excel-файл.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-select">Текущий проект</Label>
            <select
              id="project-select"
              value={targetProjectId}
              onChange={(e) => {
                setTargetProjectId(e.target.value);
                selectProject(e.target.value);
                setUploadStatus("idle");
              }}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTargetProject && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-blue-900">{selectedTargetProject.name}</p>
                {selectedTargetProject.backendId ? (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                    сервер #{selectedTargetProject.backendId}
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                    не связан с сервером
                  </span>
                )}
              </div>
              <p className="text-sm text-blue-700 mt-1">{selectedTargetProject.description}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="text-emerald-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Паспорт файла ВКР</h3>
              <p className="text-sm text-gray-500 mt-1">
                Актуальный входной контракт для приложения А.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Период</div>
              <div className="mt-1 font-semibold text-gray-900">12.01.2026-29.05.2026</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Спринты</div>
              <div className="mt-1 font-semibold text-gray-900">20 недельных</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Заявки</div>
              <div className="mt-1 font-semibold text-gray-900">200</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Участие</div>
              <div className="mt-1 font-semibold text-gray-900">509 строк</div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Типы заявок: 40 консультаций, 100 ошибок, 60 доработок.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
            <FolderPlus className="text-sky-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Создать новый проект</h3>
            <p className="text-sm text-gray-500 mt-1">
                Новый проект создаётся на сервере и появляется в списке проектов.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="new-project-name">Название проекта</Label>
            <Input
              id="new-project-name"
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              placeholder="Например: SCRUMS июль 2026"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-project-description">Описание</Label>
            <Input
              id="new-project-description"
              value={newProjectDescription}
              onChange={(event) => setNewProjectDescription(event.target.value)}
              placeholder="Кратко, какие данные будут загружаться"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={() => void handleCreateProject()}
              disabled={isCreatingProject}
              className="w-full bg-sky-600 hover:bg-sky-700 lg:w-auto"
            >
              <FolderPlus size={16} />
              {isCreatingProject ? "Создаём..." : "Создать"}
            </Button>
          </div>
        </div>

        {projectSuccessMessage && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {projectSuccessMessage}
          </div>
        )}
        {projectError && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {projectError}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <FileSpreadsheet className="text-violet-600" size={20} />
          </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Поля для расчёта</h3>
              <p className="text-sm text-gray-500 mt-1">
                Чтобы расчёт работал, Excel-файл должен содержать эти поля.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Button asChild variant="outline" className="border-violet-200 text-violet-700 hover:bg-violet-50">
              <a href={IMPORT_TEMPLATE_URL} target="_blank" rel="noreferrer">
                <FileSpreadsheet size={16} />
                Скачать шаблон SCRUMS .xlsx
              </a>
            </Button>
          </div>
        <div className="flex flex-wrap gap-2 mt-5">
          {uploadFields.map((field) => (
            <span
              key={field}
              className="px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-sm font-medium text-violet-800"
            >
              {field}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 border border-gray-200">
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Upload className="text-blue-600" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Загрузите Excel-файл в SCRUMS {selectedTargetProject ? `«${selectedTargetProject.name}»` : ""}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Перетащите файл SCRUMS input Jan-Jun 2026.xlsx сюда или нажмите для выбора
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept=".xlsx"
                onChange={handleFileSelect}
              />
              <span className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700">
                <FileSpreadsheet size={20} />
                {uploadStatus === "uploading" ? "Загружаем..." : "Выбрать файл"}
              </span>
            </label>
            <p className="text-xs text-gray-400 mt-4">Поддерживаемый формат: .xlsx</p>
          </div>
        </div>

        {uploadStatus === "uploading" && (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900">
              Файл загружается на сервер и проверяется по шаблону SCRUMS.
            </p>
            <p className="mt-1 text-sm text-blue-700">
              Не закрывайте страницу, пока импорт не завершится.
            </p>
          </div>
        )}

        {uploadStatus === "success" && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="text-green-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-900">Загрузка успешна</h4>
              <p className="text-sm text-green-700 mt-1">
                Файл {lastUploadedFile ? `«${lastUploadedFile}» ` : ""}успешно загружен в проект{" "}
                {selectedTargetProject ? `«${selectedTargetProject.name}»` : ""}. Импортировано{" "}
                {latestProjectUpload?.records ?? 0} строк участия специалистов.
              </p>
            </div>
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <XCircle className="text-red-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-900">Ошибка валидации</h4>
              <p className="text-sm text-red-700 mt-1">
                {uploadErrorMessage || "Сначала выберите проект для импорта, затем повторите загрузку файла."}
              </p>
            </div>
          </div>
        )}
      </div>

      {(hasData || isAnalyticsLoading) && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Актуальные данные проекта</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Первые рассчитанные строки выбранного проекта.
                </p>
              </div>
              {hasData && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600">
                  {dashboard.requestCount ?? previewRows.length} заявок · {dashboard.assignmentRows ?? 0} строк участия
                </div>
              )}
            </div>
          </div>
          {isAnalyticsLoading ? (
            <div className="px-6 py-8 text-sm text-gray-500">
              Загружаем данные проекта с сервера...
            </div>
          ) : previewRows.length === 0 ? (
            <div className="px-6 py-8 text-sm text-gray-500">
              У проекта есть аналитика, но сервер не вернул строки для просмотра.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Заявка
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Спринт
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Story Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тип заявки
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Исполнители
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tplan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tfact
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.sprint}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.storyPoints}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            row.complexity === "XL"
                              ? "bg-red-100 text-red-800"
                              : row.complexity === "L"
                              ? "bg-amber-100 text-amber-800"
                              : row.complexity === "M"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {row.complexity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.participants}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.plannedHours} ч
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.actualHours} ч
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">История загрузок</h3>
            <p className="text-sm text-gray-500 mt-1">
              Недавние импорты для проекта {selectedTargetProject?.name}
            </p>
          </div>
        <div className="divide-y divide-gray-200">
          {isHistoryLoading && (
            <div className="px-6 py-4 text-sm text-gray-500">
              Загружаем историю импортов с сервера...
            </div>
          )}
          {projectUploads.length === 0 && (
            <div className="px-6 py-8 text-sm text-gray-500">
              Для этого набора пока нет загрузок. Загрузите первый Excel-файл.
            </div>
          )}
          {projectUploads.map((item) => (
            <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  item.status === "success" ? "bg-green-100" : "bg-red-100"
                }`}>
                  {item.status === "success" ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <XCircle className="text-red-600" size={20} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.filename}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={12} />
                      {item.date}
                    </span>
                    {item.status === "success" && (
                      <span className="text-xs text-gray-500">{item.records} строк участия</span>
                    )}
                  </div>
                </div>
              </div>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  item.status === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {item.status === "success" ? "Успешно" : "Ошибка"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
