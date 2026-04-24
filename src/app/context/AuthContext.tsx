import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthContextValue = {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
};

const STORAGE_KEY = "scrum-metrics-authenticated";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") return true;

    const savedAuthState = window.localStorage.getItem(STORAGE_KEY);
    return savedAuthState === null ? true : savedAuthState === "true";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(STORAGE_KEY, String(isAuthenticated));
  }, [isAuthenticated]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      login: () => setIsAuthenticated(true),
      logout: () => setIsAuthenticated(false),
    }),
    [isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
