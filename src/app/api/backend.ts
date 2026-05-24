import type { Project, UploadRecord } from "../context/ProjectsContext";

export type BackendProject = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type BackendUpload = {
  id: number;
  project_id: number;
  original_filename: string;
  storage_path: string | null;
  status: "pending" | "processed" | "failed";
  records_count: number;
  error_message: string | null;
  uploaded_at: string;
  processed_at: string | null;
};

export type BackendImportResult = {
  upload: BackendUpload;
  created_tasks: number;
  updated_tasks: number;
  assignments_written: number;
  sprints_touched: number;
};

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000/api/v1";

export const IMPORT_TEMPLATE_URL = `${API_BASE_URL}/projects/import-template/xlsx`;

export class BackendApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
  }
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "detail" in payload &&
    typeof payload.detail === "string"
  ) {
    return payload.detail;
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  return fallback;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as unknown)
    : await response.text();

  if (!response.ok) {
    throw new BackendApiError(
      response.status,
      extractErrorMessage(payload, "Backend request failed."),
    );
  }

  return payload as T;
}

export function listBackendProjects() {
  return apiRequest<BackendProject[]>("/projects");
}

export function createBackendProject(project: Pick<Project, "name" | "description">) {
  return apiRequest<BackendProject>("/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: project.name,
      description: project.description,
    }),
  });
}

export function listProjectUploads(projectId: number) {
  return apiRequest<BackendUpload[]>(`/projects/${projectId}/uploads`);
}

export async function uploadProjectExcel(projectId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<BackendImportResult>(`/projects/${projectId}/uploads/excel`, {
    method: "POST",
    body: formData,
  });
}

export function mapBackendUploadsToRecords(
  projectId: string,
  backendUploads: BackendUpload[],
): UploadRecord[] {
  return backendUploads.map((upload) => ({
    id: upload.id,
    projectId,
    filename: upload.original_filename,
    date: new Date(upload.uploaded_at).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: upload.status === "processed" ? "success" : "error",
    records: upload.records_count,
  }));
}
