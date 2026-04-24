import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { Dashboard } from "./pages/Dashboard";
import { DataUpload } from "./pages/DataUpload";
import { TeamAnalysis } from "./pages/TeamAnalysis";
import { SprintAnalysis } from "./pages/SprintAnalysis";
import { Recommendations } from "./pages/Recommendations";

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
    ],
  },
]);
