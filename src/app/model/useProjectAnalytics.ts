import { useEffect, useMemo, useState } from "react";
import { getProjectAnalytics } from "../api/backend";
import { useProjects } from "../context/ProjectsContext";
import { projectAnalytics } from "./projectAnalytics";

export function useProjectAnalytics() {
  const { selectedProject } = useProjects();
  const [backendAnalytics, setBackendAnalytics] = useState<null | ReturnType<typeof buildFallbackAnalytics>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ projectId?: string }>;
      if (!customEvent.detail?.projectId || customEvent.detail.projectId === selectedProject?.id) {
        setRefreshKey((current) => current + 1);
      }
    };

    window.addEventListener("project-analytics-refresh", handleRefresh as EventListener);
    return () => {
      window.removeEventListener("project-analytics-refresh", handleRefresh as EventListener);
    };
  }, [selectedProject?.id]);

  useEffect(() => {
    let isCancelled = false;

    if (!selectedProject?.backendId) {
      setBackendAnalytics(null);
      setIsLoading(false);
      setError("");
      return;
    }

    const loadAnalytics = async () => {
      setIsLoading(true);
      setError("");

      try {
        const analytics = await getProjectAnalytics(selectedProject.backendId!);
        if (!isCancelled) {
          setBackendAnalytics({
            ...analytics,
            projectName: analytics.projectName || selectedProject.name,
          });
        }
      } catch (nextError) {
        if (!isCancelled) {
          setBackendAnalytics(null);
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Не удалось загрузить аналитику проекта с backend.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadAnalytics();

    return () => {
      isCancelled = true;
    };
  }, [refreshKey, selectedProject?.backendId, selectedProject?.name]);

  const fallback = useMemo(
    () => buildFallbackAnalytics(selectedProject?.name),
    [selectedProject?.name],
  );

  return useMemo(
    () => ({
      ...(backendAnalytics ?? fallback),
      isLoading,
      error,
      isBackendDriven: Boolean(backendAnalytics),
    }),
    [backendAnalytics, error, fallback, isLoading],
  );
}

function buildFallbackAnalytics(projectName?: string) {
  return {
    projectName: projectName ?? "Команда мобильного приложения",
    hasData: false,
    ...projectAnalytics,
  };
}
