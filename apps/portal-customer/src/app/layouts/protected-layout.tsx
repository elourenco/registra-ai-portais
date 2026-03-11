import {
  type BreadcrumbItem,
  LayoutDashboardIcon,
  PortalAppShell,
  type SidebarSection,
} from "@registra/ui";
import { matchPath, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import { portalConfig } from "@/shared/config/portal-config";
import { routes } from "@/shared/constants/routes";

const sections: SidebarSection[] = [
  {
    sectionLabel: "Overview",
    items: [
      {
        to: routes.dashboard,
        label: "Dashboard",
        description: "Visao financeira",
        icon: LayoutDashboardIcon,
        exact: true,
      },
    ],
  },
];

const shellRoutes: Array<{ pattern: string; breadcrumbs: BreadcrumbItem[] }> = [
  {
    pattern: routes.dashboard,
    breadcrumbs: [{ label: "Dashboard" }],
  },
];

export function ProtectedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, session } = useAuth();
  const shellRoute =
    shellRoutes.find((item) => matchPath({ path: item.pattern, end: true }, location.pathname)) ??
    shellRoutes[0];

  return (
    <PortalAppShell
      isAuthenticated={isAuthenticated}
      loginRoute={routes.login}
      portalName={portalConfig.name}
      searchPlaceholder="Buscar transacoes e categorias"
      sections={sections}
      breadcrumbs={shellRoute.breadcrumbs}
      headerIcon={LayoutDashboardIcon}
      sidebarStorageKey="registra-ai.customer.sidebar-collapsed"
      user={{
        name: session?.user.name,
        email: session?.user.email,
      }}
      onLogout={() => {
        logout();
        navigate(routes.login, { replace: true });
      }}
    >
      <Outlet />
    </PortalAppShell>
  );
}
