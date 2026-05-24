import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { Dashboard } from "./pages/Dashboard";
import { DataUpload } from "./pages/DataUpload";
import { TeamAnalysis } from "./pages/TeamAnalysis";
import { SprintAnalysis } from "./pages/SprintAnalysis";
import { Recommendations } from "./pages/Recommendations";
import { MathematicalModel } from "./pages/MathematicalModel";
import { TaskDetails } from "./pages/TaskDetails";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "upload", Component: DataUpload },
      { path: "team", Component: TeamAnalysis },
      { path: "sprint", Component: SprintAnalysis },
      { path: "recommendations", Component: Recommendations },
      { path: "tasks", Component: TaskDetails },
      { path: "model", Component: MathematicalModel },
    ],
  },
]);
