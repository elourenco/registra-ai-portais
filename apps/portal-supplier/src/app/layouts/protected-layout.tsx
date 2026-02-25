import {
  GitBranchIcon,
  LayoutDashboardIcon,
  PortalAppShell,
  ShieldCheckIcon,
  type SidebarSection,
} from "@registra/ui";
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
        description: "Performance financeira",
        icon: LayoutDashboardIcon,
      },
      {
        to: routes.workflow,
        label: "Workflow",
        description: "Etapas de compliance",
        icon: GitBranchIcon,
      },
      {
        to: routes.onboarding,
        label: "Onboarding",
        description: "Cadastro da empresa",
        icon: ShieldCheckIcon,
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
      searchPlaceholder="Buscar workflow, documentos e transacoes"
      sections={sections}
      sidebarStorageKey="registra-ai.supplier.sidebar-collapsed"
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
