import { RouterProvider } from "react-router";
import { LoginScreen } from "./components/LoginScreen";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProjectsProvider } from "./context/ProjectsContext";
import { router } from "./routes";

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <AuthProvider>
      <ProjectsProvider>
        <AppContent />
      </ProjectsProvider>
    </AuthProvider>
  );
}
