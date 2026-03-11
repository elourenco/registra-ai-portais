import {
  type BreadcrumbItem,
  GitBranchIcon,
  type HeaderAction,
  type HeaderIcon,
  LayoutDashboardIcon,
  PortalAppShell,
  ShieldCheckIcon,
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
        description: "Performance financeira",
        icon: LayoutDashboardIcon,
        exact: true,
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

interface ShellRouteMeta {
  pattern: string;
  icon: HeaderIcon;
  breadcrumbs: BreadcrumbItem[];
  actions?: HeaderAction[];
}

const shellRoutes: ShellRouteMeta[] = [
  {
    pattern: routes.workflow,
    icon: GitBranchIcon,
    breadcrumbs: [{ label: "Dashboard", to: routes.dashboard }, { label: "Workflow" }],
    actions: [{ label: "Onboarding", to: routes.onboarding, variant: "outline" }],
  },
  {
    pattern: routes.onboarding,
    icon: ShieldCheckIcon,
    breadcrumbs: [{ label: "Dashboard", to: routes.dashboard }, { label: "Onboarding" }],
    actions: [{ label: "Workflow", to: routes.workflow, variant: "outline" }],
  },
  {
    pattern: routes.dashboard,
    icon: LayoutDashboardIcon,
    breadcrumbs: [{ label: "Dashboard" }],
    actions: [
      { label: "Workflow", to: routes.workflow, variant: "outline" },
      { label: "Onboarding", to: routes.onboarding, variant: "outline" },
    ],
  },
];

export function ProtectedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, session } = useAuth();
  const shellRoute =
    shellRoutes.find((item) => matchPath({ path: item.pattern, end: true }, location.pathname)) ??
    shellRoutes[shellRoutes.length - 1];

  return (
    <PortalAppShell
      isAuthenticated={isAuthenticated}
      loginRoute={routes.login}
      portalName={portalConfig.name}
      searchPlaceholder="Buscar workflow, documentos e transacoes"
      sections={sections}
      breadcrumbs={shellRoute.breadcrumbs}
      headerIcon={shellRoute.icon}
      headerActions={shellRoute.actions}
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
