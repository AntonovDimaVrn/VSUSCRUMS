import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UploadStatus = "success" | "error";

export type UploadRecord = {
  id: number;
  projectId: string;
  filename: string;
  date: string;
  status: UploadStatus;
  records: number;
};

export type Project = {
  id: string;
  backendId?: number | null;
  name: string;
  description: string;
  createdAt: string;
};

type CreateProjectInput = {
  name: string;
  description?: string;
};

type UploadFileInput = {
  projectId: string;
  filename: string;
  records: number;
  status?: UploadStatus;
};

type ProjectsContextValue = {
  projects: Project[];
  selectedProjectId: string;
  selectedProject: Project | undefined;
  uploads: UploadRecord[];
  selectProject: (projectId: string) => void;
  createProject: (input: CreateProjectInput) => Project;
  addUpload: (input: UploadFileInput) => UploadRecord;
  linkProjectToBackend: (projectId: string, backendId: number) => void;
  replaceProjectUploads: (projectId: string, nextUploads: UploadRecord[]) => void;
};

const STORAGE_KEY = "scrum-metrics-projects-state";

const initialProjects: Project[] = [
  {
    id: "mobile-app",
    name: "Команда мобильного приложения",
    description: "iOS и Android команда с двухнедельными спринтами.",
    createdAt: "2026-04-05",
  },
  {
    id: "web-platform",
    name: "Web Platform",
    description: "Веб-платформа аналитики и внутренние сервисы.",
    createdAt: "2026-04-08",
  },
  {
    id: "data-core",
    name: "Data Core",
    description: "Команда витрин данных и интеграций.",
    createdAt: "2026-04-12",
  },
];

const initialUploads: UploadRecord[] = [
  {
    id: 1,
    projectId: "mobile-app",
    filename: "sprint-data-q1-2026.xlsx",
    date: "20.04.2026",
    status: "success",
    records: 342,
  },
  {
    id: 2,
    projectId: "mobile-app",
    filename: "team-tasks-march.xlsx",
    date: "15.04.2026",
    status: "success",
    records: 289,
  },
  {
    id: 3,
    projectId: "web-platform",
    filename: "sprint-planning-feb.xlsx",
    date: "10.04.2026",
    status: "error",
    records: 0,
  },
  {
    id: 4,
    projectId: "data-core",
    filename: "backlog-jan-2026.xlsx",
    date: "05.04.2026",
    status: "success",
    records: 412,
  },
];

const defaultState = {
  projects: initialProjects,
  selectedProjectId: initialProjects[0]?.id ?? "",
  uploads: initialUploads,
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(defaultState.projects);
  const [selectedProjectId, setSelectedProjectId] = useState(defaultState.selectedProjectId);
  const [uploads, setUploads] = useState<UploadRecord[]>(defaultState.uploads);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedState = window.localStorage.getItem(STORAGE_KEY);
    if (!savedState) {
      setIsHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(savedState) as typeof defaultState;
      if (parsed.projects?.length) {
        setProjects(parsed.projects);
        setSelectedProjectId(parsed.selectedProjectId || parsed.projects[0].id);
      }
      if (parsed.uploads) {
        setUploads(parsed.uploads);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        projects,
        selectedProjectId,
        uploads,
      }),
    );
  }, [isHydrated, projects, selectedProjectId, uploads]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId],
  );

  const selectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
  }, []);

  const createProject = useCallback((input: CreateProjectInput) => {
    const trimmedName = input.name.trim();
    const project: Project = {
      id: `${trimmedName.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-")}-${Date.now()}`,
      backendId: null,
      name: trimmedName,
      description: input.description?.trim() || "Новый проект без описания.",
      createdAt: new Date().toISOString(),
    };

    setProjects((currentProjects) => [project, ...currentProjects]);
    setSelectedProjectId(project.id);

    return project;
  }, []);

  const addUpload = useCallback((input: UploadFileInput) => {
    const upload: UploadRecord = {
      id: Date.now(),
      projectId: input.projectId,
      filename: input.filename,
      date: new Date().toLocaleDateString("ru-RU"),
      status: input.status ?? "success",
      records: input.records,
    };

    setUploads((currentUploads) => [upload, ...currentUploads]);
    setSelectedProjectId(input.projectId);

    return upload;
  }, []);

  const linkProjectToBackend = useCallback((projectId: string, backendId: number) => {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId ? { ...project, backendId } : project,
      ),
    );
  }, []);

  const replaceProjectUploads = useCallback((projectId: string, nextUploads: UploadRecord[]) => {
    setUploads((currentUploads) => [
      ...nextUploads,
      ...currentUploads.filter((upload) => upload.projectId !== projectId),
    ]);
  }, []);

  const value = useMemo(
    () => ({
      projects,
      selectedProjectId,
      selectedProject,
      uploads,
      selectProject,
      createProject,
      addUpload,
      linkProjectToBackend,
      replaceProjectUploads,
    }),
    [
      addUpload,
      createProject,
      linkProjectToBackend,
      projects,
      replaceProjectUploads,
      selectProject,
      selectedProject,
      selectedProjectId,
      uploads,
    ],
  );

  return (
    <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);

  if (!context) {
    throw new Error("useProjects must be used within ProjectsProvider");
  }

  return context;
}
