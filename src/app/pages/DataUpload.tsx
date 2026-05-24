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
    uploads,
  } = useProjects();
  const { previewRows, uploadFields } = useProjectAnalytics();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [targetProjectId, setTargetProjectId] = useState(selectedProjectId);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [projectError, setProjectError] = useState("");
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [lastUploadedFile, setLastUploadedFile] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

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
            "Не удалось загрузить историю импортов с backend. Проверьте, что сервис доступен на localhost:8000.",
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
          : "Не удалось загрузить файл. Проверьте backend и формат Excel-шаблона.";
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

    const alreadyExists = projects.some(
      (project) => project.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (alreadyExists) {
      setProjectError("Проект с таким названием уже существует.");
      return;
    }

    const project = createProject({
      name: trimmedName,
      description: newProjectDescription,
    });
    let syncMessage = "";

    try {
      const backendProject = await createBackendProject({
        name: trimmedName,
        description: newProjectDescription.trim() || "Новый проект без описания.",
      });
      linkProjectToBackend(project.id, backendProject.id);
    } catch (error) {
      if (error instanceof BackendApiError && error.status === 409) {
        const backendProjects = await listBackendProjects();
        const existingProject = backendProjects.find(
          (item) => item.name.trim().toLowerCase() === trimmedName.toLowerCase(),
        );
        if (existingProject) {
          linkProjectToBackend(project.id, existingProject.id);
        }
      } else {
        syncMessage =
          "Проект создан локально, но backend пока недоступен. Его можно будет связать при первой загрузке Excel.";
      }
    }

    setTargetProjectId(project.id);
    setNewProjectName("");
    setNewProjectDescription("");
    setProjectError(syncMessage);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Загрузка данных</h2>
        <p className="text-sm text-gray-500 mt-1">
          Создавайте проекты и загружайте Excel-файлы в нужную рабочую область.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Database className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Проект для загрузки</h3>
              <p className="text-sm text-gray-500 mt-1">
                Выберите существующий проект, в который нужно импортировать данные.
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
              <p className="text-sm font-medium text-blue-900">{selectedTargetProject.name}</p>
              <p className="text-sm text-blue-700 mt-1">{selectedTargetProject.description}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FolderPlus className="text-emerald-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Создать новый проект</h3>
              <p className="text-sm text-gray-500 mt-1">
                Новый проект сразу появится в верхнем выпадающем списке и станет активным.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-name">Название проекта</Label>
            <Input
              id="project-name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Например, CRM Analytics"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Описание</Label>
            <Textarea
              id="project-description"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              placeholder="Коротко опишите команду, продукт или поток данных."
              className="min-h-24"
            />
          </div>

          {projectError && <p className="text-sm text-red-600">{projectError}</p>}

          <Button onClick={handleCreateProject} className="w-full bg-emerald-600 hover:bg-emerald-700">
            <FolderPlus size={16} />
            Создать проект
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <FileSpreadsheet className="text-violet-600" size={20} />
          </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Поля, необходимые для математической модели</h3>
              <p className="text-sm text-gray-500 mt-1">
                Чтобы проект рассчитывал `Q_i`, `Topt_i`, `EI_i`, `δ_i` и вероятности сроков, файл должен содержать следующие поля.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Button asChild variant="outline" className="border-violet-200 text-violet-700 hover:bg-violet-50">
              <a href={IMPORT_TEMPLATE_URL} target="_blank" rel="noreferrer">
                <FileSpreadsheet size={16} />
                Скачать шаблон .xlsx
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

      {/* Upload Area */}
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
              Загрузите Excel в проект {selectedTargetProject ? `«${selectedTargetProject.name}»` : ""}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Перетащите файл сюда или нажмите для выбора
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

        {/* Upload Status */}
        {uploadStatus === "uploading" && (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900">
              Файл загружается в backend и проходит валидацию шаблона.
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
                {latestProjectUpload?.records ?? 0} записей.
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

      {/* Data Preview */}
      {uploadStatus === "success" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Предпросмотр данных</h3>
            <p className="text-sm text-gray-500 mt-1">
              Первые строки в формате, который нужен для расчёта модели проекта {selectedTargetProject?.name}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Спринт
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Story Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Класс
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Участники
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
        </div>
      )}

      {/* Upload History */}
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
              Загружаем историю импортов из backend...
            </div>
          )}
          {projectUploads.length === 0 && (
            <div className="px-6 py-8 text-sm text-gray-500">
              Для этого проекта пока нет загрузок. Создайте проект или загрузите первый Excel-файл.
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
                      <span className="text-xs text-gray-500">{item.records} записей</span>
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
