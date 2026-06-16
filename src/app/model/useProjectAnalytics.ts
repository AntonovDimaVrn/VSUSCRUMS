import { useEffect, useMemo, useState } from "react";
import { getProjectAnalytics } from "../api/backend";
import { useProjects } from "../context/ProjectsContext";
import { projectAnalytics } from "./projectAnalytics";

const DEMO_PROJECT_ID = "scrums-vkr";

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
      setBackendAnalytics(null);

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
              : "Не удалось загрузить аналитику проекта с сервера.",
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
    () =>
      selectedProject?.id === DEMO_PROJECT_ID
        ? buildFallbackAnalytics(selectedProject?.name)
        : buildEmptyAnalytics(selectedProject?.name),
    [selectedProject?.id, selectedProject?.name],
  );

  const effectiveIsLoading = isLoading || Boolean(selectedProject?.backendId && !backendAnalytics && !error);

  return useMemo(
    () => ({
      ...(backendAnalytics ?? fallback),
      isLoading: effectiveIsLoading,
      error,
      isBackendDriven: Boolean(backendAnalytics),
    }),
    [backendAnalytics, effectiveIsLoading, error, fallback],
  );
}

function buildFallbackAnalytics(projectName?: string) {
  return {
    projectName: projectName ?? "SCRUMS input Jan-Jun 2026",
    hasData: true,
    ...projectAnalytics,
  };
}

function buildEmptyAnalytics(projectName?: string) {
  return {
    ...projectAnalytics,
    projectName: projectName ?? "Новый проект",
    hasData: false,
    dashboard: {
      ...projectAnalytics.dashboard,
      inputFile: undefined,
      sprintCount: 0,
      requestCount: 0,
      assignmentRows: 0,
      plannedHours: 0,
      actualHours: 0,
      deviationHours: 0,
      deviationPercent: 0,
      sprintSeries: [],
      complexityDistribution: [],
    },
    sprint: {
      ...projectAnalytics.sprint,
      selectedSprint: undefined,
      sprintList: [],
      sprintCards: [],
      taskBreakdown: [],
      problematicTasks: [],
      probabilityBuckets: [],
    },
    team: {
      ...projectAnalytics.team,
      totalMembers: 0,
      overloadedCount: 0,
      averageUtilization: 0,
      members: [],
      loadDistribution: [],
      complexityByRole: [],
    },
    recommendations: [],
    taskDetails: [],
  };
}
