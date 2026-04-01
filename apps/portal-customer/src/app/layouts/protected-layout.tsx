import { type BreadcrumbItem, HomeIcon, PortalAppShell, type SidebarSection } from "@registra/ui";
import { matchPath, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import imobdocLogo from "@/assets/imobdoc.svg";
import { portalConfig } from "@/shared/config/portal-config";
import { routes } from "@/shared/constants/routes";

const sections: SidebarSection[] = [
  {
    sectionLabel: "Overview",
    items: [
      {
        to: routes.process,
        label: "Processo",
        description: "Jornada do comprador",
        icon: HomeIcon,
        exact: true,
      },
    ],
  },
];

const shellRoutes: Array<{
  pattern: string;
  breadcrumbs: BreadcrumbItem[];
  headerIcon: typeof HomeIcon;
}> = [
  {
    pattern: routes.process,
    breadcrumbs: [{ label: "Processo" }],
    headerIcon: HomeIcon,
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
      searchPlaceholder="Buscar etapa ou documento"
      sections={sections}
      sidebarMode="hidden"
      breadcrumbs={shellRoute.breadcrumbs}
      headerIcon={shellRoute.headerIcon}
      headerLogoSrc={imobdocLogo}
      headerLogoAlt="ImobDoc"
      headerMode="user-only"
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
