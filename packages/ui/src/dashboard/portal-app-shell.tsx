import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { Sheet, SheetContent } from "../components/sheet";
import { cn } from "../lib/cn";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import type { PortalUser, SidebarSection } from "./types";

interface PortalAppShellProps extends PropsWithChildren {
  isAuthenticated: boolean;
  loginRoute: string;
  portalName: string;
  searchPlaceholder?: string;
  sidebarStorageKey: string;
  sections: SidebarSection[];
  user: PortalUser;
  onLogout: () => void;
  onProfile?: () => void;
}

type ThemeMode = "light" | "dark";

function readLocalStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage access issues
  }
}

function getInitialCollapsedState(storageKey: string): boolean {
  return readLocalStorage(storageKey) === "1";
}

function getInitialThemeMode(): ThemeMode {
  return readLocalStorage("registra-ai.theme") === "dark" ? "dark" : "light";
}

export function PortalAppShell({
  children,
  isAuthenticated,
  loginRoute,
  onLogout,
  onProfile,
  portalName,
  searchPlaceholder = "Buscar metricas, transacoes e categorias",
  sections,
  sidebarStorageKey,
  user,
}: PortalAppShellProps) {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() =>
    getInitialCollapsedState(sidebarStorageKey),
  );
  const [, setHeaderSearch] = useState("");
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);

  const isDarkMode = themeMode === "dark";

  useEffect(() => {
    writeLocalStorage(sidebarStorageKey, isSidebarCollapsed ? "1" : "0");
  }, [isSidebarCollapsed, sidebarStorageKey]);

  useEffect(() => {
    writeLocalStorage("registra-ai.theme", themeMode);
    const classList = document.documentElement.classList;
    classList.toggle("dark", isDarkMode);
  }, [isDarkMode, themeMode]);

  const backgroundClass = useMemo(
    () =>
      cn(
        "pointer-events-none fixed inset-0 -z-10",
        "bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_100%_100%,rgba(34,197,94,0.12),transparent_35%)]",
      ),
    [],
  );

  if (!isAuthenticated) {
    return <Navigate to={loginRoute} replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className={backgroundClass} />
      <div className="flex min-h-screen">
        <aside className="hidden transition-[width] duration-300 md:block">
          <Sidebar
            collapsed={isSidebarCollapsed}
            onToggleCollapsed={() => setSidebarCollapsed((state) => !state)}
            portalName={portalName}
            sections={sections}
          />
        </aside>

        <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="w-[300px] p-0 md:hidden">
            <Sidebar
              collapsed={false}
              onToggleCollapsed={() => setSidebarCollapsed((state) => !state)}
              onNavigate={() => setMobileSidebarOpen(false)}
              portalName={portalName}
              sections={sections}
            />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            isDarkMode={isDarkMode}
            onLogout={onLogout}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            onProfile={onProfile}
            onSearchChange={setHeaderSearch}
            onToggleTheme={() => setThemeMode((current) => (current === "dark" ? "light" : "dark"))}
            searchPlaceholder={searchPlaceholder}
            user={user}
          />

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
