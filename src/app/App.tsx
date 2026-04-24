import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ProjectsProvider } from "./context/ProjectsContext";

export default function App() {
  return (
    <ProjectsProvider>
      <RouterProvider router={router} />
    </ProjectsProvider>
  );
}
