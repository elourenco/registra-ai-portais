import {
  Building2Icon,
  type BreadcrumbItem,
  type HeaderAction,
  type HeaderIcon,
  type HeaderLeadingAction,
  LayoutDashboardIcon,
  PortalAppShell,
  ShieldCheckIcon,
  type SidebarSection,
  UserCircle2Icon,
} from "@registra/ui";
import { matchPath, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import { useDevelopmentDetailQuery } from "@/features/developments/hooks/use-development-queries";
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
    pattern: routes.developmentProcessDetail,
    icon: Building2Icon,
    breadcrumbs: [
      { label: "Dashboard", to: routes.dashboard },
      { label: "Empreendimentos", to: routes.developments },
      { label: "Processo" },
    ],
  },
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
    pattern: routes.developmentBuyerDetail,
    icon: UserCircle2Icon,
    breadcrumbs: [
      { label: "Dashboard", to: routes.dashboard },
      { label: "Empreendimentos", to: routes.developments },
      { label: "Comprador" },
    ],
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
  },
];

export function ProtectedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ developmentId: string; buyerId: string; processId: string }>();
  const { isAuthenticated, logout, session } = useAuth();
  const shellRoute =
    shellRoutes.find((item) => matchPath({ path: item.pattern, end: true }, location.pathname)) ??
    shellRoutes[shellRoutes.length - 1];
  const isDevelopmentDetailRoute = Boolean(
    matchPath({ path: routes.developmentDetail, end: true }, location.pathname),
  );
  const isDevelopmentBuyerDetailRoute = Boolean(
    matchPath({ path: routes.developmentBuyerDetail, end: true }, location.pathname),
  );
  const isDevelopmentProcessDetailRoute = Boolean(
    matchPath({ path: routes.developmentProcessDetail, end: true }, location.pathname),
  );
  const developmentDetailQuery = useDevelopmentDetailQuery(
    isDevelopmentDetailRoute || isDevelopmentBuyerDetailRoute || isDevelopmentProcessDetailRoute
      ? params.developmentId ?? null
      : null,
  );
  const resolvedLeadingAction: HeaderLeadingAction | undefined = matchPath(
    { path: routes.developmentAvailability, end: true },
    location.pathname,
  )
    ? params.developmentId
      ? {
          to: routes.developmentDetailById(params.developmentId),
          ariaLabel: "Voltar para o detalhe do empreendimento",
        }
      : undefined
    : matchPath({ path: routes.developmentBuyerCreate, end: true }, location.pathname)
      ? params.developmentId
        ? {
            to: routes.developmentDetailById(params.developmentId),
            ariaLabel: "Voltar para o detalhe do empreendimento",
          }
        : undefined
    : matchPath({ path: routes.developmentBuyerDetail, end: true }, location.pathname)
      ? params.developmentId
        ? {
            to: routes.developmentDetailById(params.developmentId),
            ariaLabel: "Voltar para o detalhe do empreendimento",
          }
        : undefined
    : matchPath({ path: routes.developmentProcessDetail, end: true }, location.pathname)
      ? params.developmentId
        ? {
            to: routes.developmentDetailById(params.developmentId),
            ariaLabel: "Voltar para o detalhe do empreendimento",
          }
        : undefined
    : matchPath({ path: routes.developmentCreate, end: true }, location.pathname)
        ? {
            to: routes.developments,
            ariaLabel: "Voltar para empreendimentos",
          }
        : matchPath({ path: routes.developmentDetail, end: true }, location.pathname)
          ? {
              to: routes.developments,
              ariaLabel: "Voltar para empreendimentos",
            }
          : matchPath({ path: routes.onboarding, end: true }, location.pathname)
            ? {
                to: routes.dashboard,
                ariaLabel: "Voltar para dashboard",
              }
            : undefined;
  const resolvedBreadcrumbs =
    isDevelopmentProcessDetailRoute &&
    params.processId &&
    developmentDetailQuery.data
      ? [
          ...shellRoute.breadcrumbs.slice(0, -1),
          {
            label:
              developmentDetailQuery.data.processes.find((process) => process.id === params.processId)
                ?.propertyLabel ?? `Processo #${params.processId}`,
          },
        ]
      : isDevelopmentBuyerDetailRoute &&
    params.buyerId &&
    developmentDetailQuery.data
      ? [
          ...shellRoute.breadcrumbs.slice(0, -1),
          {
            label:
              developmentDetailQuery.data.buyers.find((buyer) => buyer.id === params.buyerId)?.name ??
              "Comprador",
          },
        ]
      : isDevelopmentDetailRoute && developmentDetailQuery.data?.development.name
      ? [
          ...shellRoute.breadcrumbs.slice(0, -1),
          { label: developmentDetailQuery.data.development.name },
        ]
      : shellRoute.breadcrumbs;

  return (
    <PortalAppShell
      isAuthenticated={isAuthenticated}
      loginRoute={routes.login}
      portalName={portalConfig.name}
      searchPlaceholder="Buscar empreendimento, comprador ou processo"
      sections={sections}
      breadcrumbs={resolvedBreadcrumbs}
      headerIcon={shellRoute.icon}
      headerActions={shellRoute.actions}
      headerLeadingAction={resolvedLeadingAction}
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
