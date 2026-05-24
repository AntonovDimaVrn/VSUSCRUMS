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

export type BackendAnalytics = {
  hasData: boolean;
  projectName: string;
  alphaScale: Record<string, number>;
  beta: number;
  workNorms: Record<string, number>;
  logNormalParams: Record<string, { mu: number; sigma: number }>;
  regression: {
    intercept: number;
    sp: number;
    qualification: number;
    participants: number;
  };
  dashboard: {
    averageVelocity: number;
    estimateAccuracy: number;
    currentBacklogCompletion: number;
    riskScore: number;
    riskLabel: string;
    sprintSeries: Array<{
      sprint: string;
      planned: number;
      completed: number;
      sprintEi: number;
    }>;
    complexityDistribution: Array<{
      code: string;
      name: string;
      value: number;
      color: string;
    }>;
    modelSummary: Array<{
      label: string;
      value: string;
      note: string;
    }>;
  };
  sprint: {
    sprintName: string;
    dateLabel: string;
    durationDays: number;
    plannedStoryPoints: number;
    completedStoryPoints: number;
    backlogCompletionIndex: number;
    sprintEfficiencyIndex: number;
    averageTaskProbability: number;
    riskyTaskCount: number;
    carryoverTasks: BackendModeledTask[];
    problematicTasks: Array<
      BackendModeledTask & {
        severity: "high" | "medium";
        reason: string;
      }
    >;
    probabilityBuckets: Array<{
      label: string;
      count: number;
      percentage: number;
      color: string;
    }>;
  };
  team: {
    totalMembers: number;
    overloadedCount: number;
    averageUtilization: number;
    members: Array<{
      id: string;
      name: string;
      role: string;
      qualification: string;
      workload: number;
      capacity: number;
      status: "optimal" | "overloaded" | "underutilized";
      utilizationPercent: number;
      weightedEfficiency: number;
      averageProbability: number;
    }>;
    loadDistribution: Array<{
      name: string;
      workload: number;
      capacity: number;
    }>;
    complexityByRole: Array<{
      role: string;
      S: number;
      M: number;
      L: number;
      XL: number;
    }>;
  };
  recommendations: Array<{
    id: string;
    priority: "high" | "medium" | "low";
    kind: "scope" | "team" | "risk" | "calibration" | "quality";
    title: string;
    description: string;
    reason: string;
    metrics: string[];
  }>;
  previewRows: Array<{
    id: string;
    sprint: string;
    storyPoints: number;
    complexity: string;
    participants: number;
    plannedHours: number;
    actualHours: number;
  }>;
  uploadFields: string[];
};

export type BackendModeledTask = {
  id: string;
  title: string;
  sprintId: number | null;
  sprintName: string;
  storyPoints: number;
  complexity: string;
  plannedHours: number;
  actualHours: number;
  status: string;
  participantCount: number;
  weightedQualification: number;
  communicationFactor: number;
  optimalHours: number;
  efficiencyIndex: number;
  deviationPercent: number;
  onTimeProbability: number;
  area: string | null;
  participants: Array<{
    name: string;
    role: string;
    qualification: string;
    hours: number;
    alpha: number;
  }>;
  hasJuniorContributor: boolean;
  externalDependency: boolean;
};

export type BackendModelConfigVersion = {
  id: number;
  project_id: number;
  version_number: number;
  is_active: boolean;
  change_note: string | null;
  alpha_scale: Record<string, number>;
  beta: number;
  work_norms: Record<string, number>;
  formulas: Record<string, string>;
  created_at: string;
};

export type BackendModelHistoryItem = {
  id: number;
  version_number: number;
  is_active: boolean;
  change_note: string | null;
  created_at: string;
};

export type BackendTaskDetails = {
  hasData: boolean;
  projectName: string;
  modelVersionNumber: number;
  formulas: Record<string, string>;
  tasks: Array<
    BackendModeledTask & {
      modelDetails: {
        versionNumber: number;
        inputs: {
          storyPoints: number;
          complexityClass: string;
          plannedHours: number;
          actualHours: number;
          participantCount: number;
          totalParticipantHours: number;
          weightedAlphaHours: number;
          workNorm: number;
          beta: number;
          logNormalMu: number;
          logNormalSigma: number;
        };
        outputs: {
          weightedQualification: number;
          communicationFactor: number;
          optimalHours: number;
          efficiencyIndex: number;
          deviationPercent: number;
          onTimeProbability: number;
        };
        formulas: Record<string, string>;
      };
    }
  >;
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

export function getProjectAnalytics(projectId: number) {
  return apiRequest<BackendAnalytics>(`/projects/${projectId}/analytics`);
}

export function getProjectTaskDetails(projectId: number) {
  return apiRequest<BackendTaskDetails>(`/projects/${projectId}/analytics/tasks`);
}

export function getProjectModel(projectId: number) {
  return apiRequest<BackendModelConfigVersion>(`/projects/${projectId}/model`);
}

export function listProjectModelHistory(projectId: number) {
  return apiRequest<BackendModelHistoryItem[]>(`/projects/${projectId}/model/history`);
}

export function createProjectModelVersion(
  projectId: number,
  payload: {
    alpha_scale: Record<string, number>;
    beta: number;
    work_norms: Record<string, number>;
    formulas: Record<string, string>;
    change_note?: string;
  },
) {
  return apiRequest<BackendModelConfigVersion>(`/projects/${projectId}/model/versions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function restoreProjectModelVersion(projectId: number, versionId: number) {
  return apiRequest<BackendModelConfigVersion>(
    `/projects/${projectId}/model/history/${versionId}/restore`,
    {
      method: "POST",
    },
  );
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

export async function ensureBackendProjectId(
  selectedProject: Pick<Project, "id" | "name" | "description" | "backendId">,
  linkProjectToBackend: (projectId: string, backendId: number) => void,
) {
  if (selectedProject.backendId) {
    return selectedProject.backendId;
  }

  try {
    const backendProject = await createBackendProject(selectedProject);
    linkProjectToBackend(selectedProject.id, backendProject.id);
    return backendProject.id;
  } catch (error) {
    if (!(error instanceof BackendApiError) || error.status !== 409) {
      throw error;
    }

    const backendProjects = await listBackendProjects();
    const existingProject = backendProjects.find(
      (project) => project.name.trim().toLowerCase() === selectedProject.name.trim().toLowerCase(),
    );

    if (!existingProject) {
      throw error;
    }

    linkProjectToBackend(selectedProject.id, existingProject.id);
    return existingProject.id;
  }
}
