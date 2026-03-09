import { LayoutDashboardIcon, PortalAppShell, type SidebarSection } from "@registra/ui";
import { Outlet, useNavigate } from "react-router-dom";

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
      },
    ],
  },
];

export function ProtectedLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, session } = useAuth();

  return (
    <PortalAppShell
      isAuthenticated={isAuthenticated}
      loginRoute={routes.login}
      portalName={portalConfig.name}
      searchPlaceholder="Buscar transacoes e categorias"
      sections={sections}
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
