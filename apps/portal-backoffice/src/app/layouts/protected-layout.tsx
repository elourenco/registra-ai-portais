import {
  Building2Icon,
  Button,
  FileTextIcon,
  Input,
  LogOutIcon,
  MenuIcon,
  cn,
} from "@registra/ui";
import { motion } from "motion/react";
import { type ComponentType, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import { portalConfig } from "@/shared/config/portal-config";
import { routes } from "@/shared/constants/routes";

interface SidebarItem {
  to: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  {
    to: routes.dashboard,
    label: "Dashboard",
    description: "Resumo executivo",
    icon: FileTextIcon,
  },
  {
    to: routes.suppliers,
    label: "Suppliers",
    description: "Feature principal",
    icon: Building2Icon,
  },
];

const SIDEBAR_COLLAPSED_STORAGE_KEY = "registra-ai.backoffice.sidebar-collapsed";

function getUserInitials(name: string | undefined, email: string | undefined): string {
  const source = (name?.trim() || email?.trim() || "U").replace(/\s+/g, " ");
  const chunks = source.split(" ").slice(0, 2);
  return chunks.map((chunk) => chunk.charAt(0).toUpperCase()).join("");
}

function getInitialSidebarCollapsed(): boolean {
  try {
    const storedState = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    if (storedState === null) {
      return true;
    }
    return storedState === "1";
  } catch {
    return true;
  }
}

export function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isAuthenticated, logout } = useAuth();
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState<boolean>(getInitialSidebarCollapsed);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const initials = useMemo(
    () => getUserInitials(session?.user.name, session?.user.email),
    [session?.user.email, session?.user.name],
  );

  useEffect(() => {
    setMobileSidebarOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, isSidebarCollapsed ? "1" : "0");
    } catch {
      // ignore write errors for privacy mode and restricted environments
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || !userMenuRef.current?.contains(target)) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUserMenuOpen]);

  if (!isAuthenticated) {
    return <Navigate to={routes.login} replace />;
  }

  const handleLogout = () => {
    logout();
    navigate(routes.login, { replace: true });
  };

  const renderSidebarNav = (collapsed: boolean) => (
    <nav className="space-y-2">
      {sidebarItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            cn(
              "group flex rounded-xl border border-transparent py-3 transition-colors",
              "hover:border-border hover:bg-secondary/75",
              isActive ? "border-primary/35 bg-primary/10" : "",
              collapsed ? "justify-center px-2" : "items-center gap-3 px-3",
            )
          }
        >
          <item.icon className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
          {!collapsed && (
            <span className="min-w-0">
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_0%_20%,rgba(249,115,22,0.14),transparent_42%),radial-gradient(circle_at_90%_100%,rgba(245,158,11,0.12),transparent_46%)]" />
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "hidden shrink-0 border-r border-border/70 bg-card/75 p-5 backdrop-blur transition-[width] duration-200 md:flex md:flex-col",
            isSidebarCollapsed ? "w-24" : "w-80",
          )}
        >
          <div
            className={cn(
              "mb-8 flex items-center",
              isSidebarCollapsed ? "justify-center" : "justify-between px-2",
            )}
          >
            {!isSidebarCollapsed && (
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Registra AI</p>
                <h1 className="text-lg font-semibold">{portalConfig.name}</h1>
              </div>
            )}
            {isSidebarCollapsed && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 px-0"
                onClick={() => setSidebarCollapsed((state) => !state)}
                aria-label="Expandir sidebar"
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
            )}
          </div>

          {renderSidebarNav(isSidebarCollapsed)}

          {!isSidebarCollapsed && (
            <footer className="mt-auto border-t border-border/70 pt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 px-0"
                onClick={() => setSidebarCollapsed(true)}
                aria-label="Recolher sidebar"
              >
                {"<"}
              </Button>
            </footer>
          )}
        </aside>

        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/50 p-4 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <motion.aside
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full w-full max-w-xs rounded-2xl border border-border bg-card p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium">Navegação</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  Fechar
                </Button>
              </div>
              <div className="mb-6 space-y-1 px-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Registra AI</p>
                <h1 className="text-lg font-semibold">{portalConfig.name}</h1>
              </div>
              {renderSidebarNav(false)}
            </motion.aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur"
          >
            <div className="grid h-20 grid-cols-[auto,1fr,auto] items-center gap-3 px-4 md:px-6">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  Menu
                </Button>
              </div>

              <div className="mx-auto w-full max-w-2xl">
                <Input
                  type="search"
                  placeholder="Buscar suppliers, CNPJ ou documentos"
                  className="h-11 rounded-full border-slate-300 bg-card pl-4 shadow-sm"
                />
              </div>

              <div ref={userMenuRef} className="relative justify-self-end">
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-full border bg-card px-2.5 py-1.5 text-left shadow-sm transition-colors hover:bg-secondary/80"
                  onClick={() => setUserMenuOpen((state) => !state)}
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                    {initials}
                  </span>
                  <span className="hidden sm:block">
                    <span className="block text-sm font-semibold leading-tight">
                      {session?.user.name ?? "Usuário"}
                    </span>
                    <span className="block text-xs leading-tight text-muted-foreground">
                      {session?.user.email ?? "-"}
                    </span>
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full z-40 mt-2 w-52 rounded-xl border bg-card p-1 shadow-lg">
                    <button
                      type="button"
                      className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate(routes.profile);
                      }}
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                      onClick={handleLogout}
                    >
                      <LogOutIcon className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.header>

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
