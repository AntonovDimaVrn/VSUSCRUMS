import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Upload,
  Users,
  Calendar,
  Lightbulb,
  ListTodo,
  Sigma,
  ChevronDown,
  FolderKanban,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useProjects } from "../context/ProjectsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { projects, selectedProject, selectProject } = useProjects();

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Обзор аналитики" },
    { path: "/upload", icon: Upload, label: "Загрузка Excel" },
    { path: "/sprint", icon: Calendar, label: "Анализ спринтов" },
    { path: "/team", icon: Users, label: "Анализ команды" },
    { path: "/tasks", icon: ListTodo, label: "Детализация заявок" },
    { path: "/recommendations", icon: Lightbulb, label: "Рекомендации" },
    { path: "/model", icon: Sigma, label: "Математическая модель" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-50">
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">SCRUMS</h1>
          <p className="text-sm text-gray-500 mt-1">Учёт трудозатрат</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-100 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700">AM</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Аналитик</p>
                  <p className="text-xs text-gray-500">scrums@project.local</p>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56">
              <DropdownMenuLabel>Профиль</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="text-red-600 focus:text-red-700">
                <LogOut size={16} />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Проект:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-900">
                      {selectedProject?.name ?? "Выберите проект"}
                    </span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  <DropdownMenuLabel>Доступные проекты</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onSelect={() => selectProject(project.id)}
                      className="flex items-start gap-3 py-3"
                    >
                      <FolderKanban size={16} className="mt-0.5 text-blue-600" />
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        <div className="text-xs text-gray-500">{project.description}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('ru-RU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
