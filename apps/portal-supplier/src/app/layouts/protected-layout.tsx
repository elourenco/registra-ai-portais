import {
  Building2Icon,
  type BreadcrumbItem,
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
        to: routes.developments,
        label: "Empreendimentos",
        description: "Carteira do supplier",
        icon: Building2Icon,
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
    pattern: routes.developmentAvailability,
    icon: Building2Icon,
    breadcrumbs: [
      { label: "Dashboard", to: routes.dashboard },
      { label: "Empreendimentos", to: routes.developments },
      { label: "Disponibilidade" },
    ],
  },
  {
    pattern: routes.developmentBuyerCreate,
    icon: Building2Icon,
    breadcrumbs: [
      { label: "Dashboard", to: routes.dashboard },
      { label: "Empreendimentos", to: routes.developments },
      { label: "Cadastrar comprador" },
    ],
    actions: [{ label: "Novo empreendimento", to: routes.developmentCreate, variant: "outline" }],
  },
  {
    pattern: routes.developmentCreate,
    icon: Building2Icon,
    breadcrumbs: [
      { label: "Dashboard", to: routes.dashboard },
      { label: "Empreendimentos", to: routes.developments },
      { label: "Cadastrar empreendimento" },
    ],
    actions: [{ label: "Ver empreendimentos", to: routes.developments, variant: "outline" }],
  },
  {
    pattern: routes.developmentDetail,
    icon: Building2Icon,
    breadcrumbs: [
      { label: "Dashboard", to: routes.dashboard },
      { label: "Empreendimentos", to: routes.developments },
      { label: "Detalhe" },
    ],
    actions: [{ label: "Onboarding", to: routes.onboarding, variant: "outline" }],
  },
  {
    pattern: routes.onboarding,
    icon: ShieldCheckIcon,
    breadcrumbs: [{ label: "Dashboard", to: routes.dashboard }, { label: "Onboarding" }],
    actions: [{ label: "Empreendimentos", to: routes.developments, variant: "outline" }],
  },
  {
    pattern: routes.dashboard,
    icon: LayoutDashboardIcon,
    breadcrumbs: [{ label: "Dashboard" }],
    actions: [
      { label: "Empreendimentos", to: routes.developments, variant: "outline" },
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
      searchPlaceholder="Buscar empreendimento, comprador ou processo"
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
