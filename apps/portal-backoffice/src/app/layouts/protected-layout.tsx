import {
  Building2Icon,
  GitBranchIcon,
  LayoutDashboardIcon,
  ListTreeIcon,
  PortalAppShell,
  Settings2Icon,
  UserCircle2Icon,
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
        description: "Visao executiva",
        icon: LayoutDashboardIcon,
      },
      {
        to: routes.customers,
        label: "Customers",
        description: "Gestao de clientes",
        icon: UserCircle2Icon,
      },
      {
        to: routes.suppliers,
        label: "Suppliers",
        description: "Gestao de fornecedores",
        icon: Building2Icon,
      },
    ],
  },
  {
    sectionLabel: "Workflow",
    items: [
      {
        to: routes.workflowList,
        label: "Workflow List",
        description: "Fluxos disponiveis",
        icon: GitBranchIcon,
      },
      {
        to: routes.workflowSteps,
        label: "Workflow Steps",
        description: "Etapas e transicoes",
        icon: ListTreeIcon,
      },
      {
        to: routes.workflowRules,
        label: "Workflow Rules",
        description: "Regras por etapa",
        icon: Settings2Icon,
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
      searchPlaceholder="Buscar cliente, fornecedor, workflow e transacoes"
      sections={sections}
      sidebarStorageKey="registra-ai.backoffice.sidebar-collapsed"
      user={{
        name: session?.user.name,
        email: session?.user.email,
      }}
      onLogout={() => {
        logout();
        navigate(routes.login, { replace: true });
      }}
      onProfile={() => navigate(routes.profile)}
    >
      <Outlet />
    </PortalAppShell>
  );
}
