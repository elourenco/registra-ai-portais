import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { Sheet, SheetContent } from "../components/sheet";
import { cn } from "../lib/cn";
import { ContextSidebar } from "./context-sidebar";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import type {
  BreadcrumbItem,
  ConfigMenuItem,
  ContextSidebarConfig,
  HeaderAction,
  HeaderIcon,
  HeaderLeadingAction,
  HeaderUtilityAction,
  PortalUser,
  SidebarSection,
} from "./types";

interface PortalAppShellProps extends PropsWithChildren {
  isAuthenticated: boolean;
  loginRoute: string;
  portalName: string;
  searchPlaceholder?: string;
  sidebarStorageKey: string;
  sections: SidebarSection[];
  sidebarMode?: "default" | "hidden";
  contextSidebar?: ContextSidebarConfig | null;
  breadcrumbs?: BreadcrumbItem[];
  headerIcon?: HeaderIcon;
  headerTitle?: string;
  headerDescription?: string;
  headerActions?: HeaderAction[];
  headerLeadingAction?: HeaderLeadingAction;
  headerUtilityAction?: HeaderUtilityAction;
  showHeaderNotifications?: boolean;
  headerMode?: "default" | "user-only";
  contentWidth?: "default" | "full";
  configItems?: ConfigMenuItem[];
  user: PortalUser;
  onLogout: () => void;
  onProfile?: () => void;
}

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

export function PortalAppShell({
  children,
  isAuthenticated,
  loginRoute,
  onLogout,
  onProfile,
  portalName,
  searchPlaceholder = "Buscar métricas, transações e categorias",
  sections,
  sidebarMode = "default",
  contextSidebar,
  breadcrumbs,
  headerIcon,
  headerTitle,
  headerDescription,
  headerActions,
  headerLeadingAction,
  headerUtilityAction,
  showHeaderNotifications = true,
  headerMode = "default",
  contentWidth = "default",
  configItems,
  sidebarStorageKey,
  user,
}: PortalAppShellProps) {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() =>
    getInitialCollapsedState(sidebarStorageKey),
  );
  const [, setHeaderSearch] = useState("");
  const effectiveSidebarCollapsed = contextSidebar ? true : isSidebarCollapsed;
  const shouldRenderSidebar = sidebarMode !== "hidden";

  useEffect(() => {
    writeLocalStorage(sidebarStorageKey, isSidebarCollapsed ? "1" : "0");
  }, [isSidebarCollapsed, sidebarStorageKey]);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    window.localStorage.removeItem("registra-ai.theme");
  }, []);

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
        {shouldRenderSidebar ? (
          <aside className="sticky top-0 hidden h-screen shrink-0 transition-[width] duration-300 md:block">
            <Sidebar
              collapsed={effectiveSidebarCollapsed}
              hideToggle={Boolean(contextSidebar)}
              onToggleCollapsed={() => setSidebarCollapsed((state) => !state)}
              portalName={portalName}
              sections={sections}
              user={user}
              configItems={configItems}
              onLogout={onLogout}
              onProfile={onProfile}
            />
          </aside>
        ) : null}

        {shouldRenderSidebar ? (
          <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetContent side="left" className="w-[300px] p-0 md:hidden">
              <Sidebar
                collapsed={false}
                onToggleCollapsed={() => setSidebarCollapsed((state) => !state)}
                onNavigate={() => setMobileSidebarOpen(false)}
                portalName={portalName}
                sections={sections}
                user={user}
                configItems={configItems}
                onLogout={onLogout}
                onProfile={onProfile}
              />
            </SheetContent>
          </Sheet>
        ) : null}

        {contextSidebar ? <ContextSidebar config={contextSidebar} /> : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            breadcrumbs={breadcrumbs}
            headerIcon={headerIcon}
            title={headerTitle}
            description={headerDescription}
            headerActions={headerActions}
            headerLeadingAction={headerLeadingAction}
            headerUtilityAction={headerUtilityAction}
            showNotifications={showHeaderNotifications}
            mode={headerMode}
            user={user}
            onLogout={onLogout}
            onOpenMobileSidebar={() => {
              if (shouldRenderSidebar) {
                setMobileSidebarOpen(true);
              }
            }}
            onSearchChange={setHeaderSearch}
            searchPlaceholder={searchPlaceholder}
          />

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className={cn("w-full", contentWidth === "default" ? "mx-auto max-w-7xl" : "")}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
