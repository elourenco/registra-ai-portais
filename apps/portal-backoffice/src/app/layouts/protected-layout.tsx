import {
  type BreadcrumbItem,
  Building2Icon,
  type ContextSidebarConfig,
  FileTextIcon,
  GitBranchIcon,
  type HeaderAction,
  type HeaderIcon,
  LayoutDashboardIcon,
  ListTreeIcon,
  PortalAppShell,
  Settings2Icon,
  ShieldCheckIcon,
  type SidebarSection,
  UserCircle2Icon,
} from "@registra/ui";
import { CircleUserRound, ClipboardList, FolderKanban, ScrollText, Users2 } from "lucide-react";
import { useMemo, useState } from "react";
import { matchPath, Outlet, useLocation, useNavigate, useOutlet } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import {
  PageHeaderProvider,
  type PageHeaderConfig,
} from "@/app/providers/page-header-provider";
import { WorkspaceSidebarProvider } from "@/app/providers/workspace-sidebar-provider";
import { buildSupplierWorkspaceSidebar } from "@/features/operations/core/workspace-sidebar";
import { useOperationsWorkspaceQuery } from "@/features/operations/hooks/use-operations-workspace-query";
import { portalConfig } from "@/shared/config/portal-config";
import { routes } from "@/shared/constants/routes";

const sections: SidebarSection[] = [
  {
    sectionLabel: "Principal",
    items: [
      {
        to: routes.dashboard,
        label: "Dashboard",
        icon: LayoutDashboardIcon,
        exact: true,
      },
      {
        to: routes.suppliers,
        label: "Clientes",
        icon: Building2Icon,
        exact: true,
      },
      {
        to: routes.settings,
        label: "Configuração",
        icon: Settings2Icon,
        exact: true,
      },
    ],
  },
];

interface ShellRouteMeta {
  pattern: string;
  icon: HeaderIcon;
  breadcrumbs: (params: Record<string, string | undefined>) => BreadcrumbItem[];
  actions?: (params: Record<string, string | undefined>) => HeaderAction[];
  showNotifications?: boolean;
}

const shellRouteMeta: ShellRouteMeta[] = [
  {
    pattern: routes.workflowRules,
    icon: ScrollText,
    breadcrumbs: () => [
      { label: "Dashboard", to: routes.dashboard },
      { label: "Fluxos", to: routes.workflowList },
      { label: "Etapas" },
      { label: "Regras" },
    ],
    actions: (params) => [
      {
        label: "Voltar para etapas",
        to: params.workflowId ? routes.workflowStepsById(params.workflowId) : routes.workflowList,
        variant: "outline",
      },
    ],
  },
  {
    pattern: routes.workflowSteps,
    icon: ScrollText,
    breadcrumbs: () => [
      { label: "Dashboard", to: routes.dashboard },
      { label: "Fluxos", to: routes.workflowList },
      { label: "Etapas" },
    ],
    actions: () => [{ label: "Voltar para fluxos", to: routes.workflowList, variant: "outline" }],
  },
  {
    pattern: routes.backofficeUsers,
    icon: Users2,
    breadcrumbs: () => [{ label: "Usuários" }],
    actions: () => [{ label: "Configurações", to: routes.settings, variant: "outline" }],
  },
  {
    pattern: routes.profile,
    icon: UserCircle2Icon,
    breadcrumbs: () => [{ label: "Dashboard", to: routes.dashboard }, { label: "Perfil" }],
  },
  {
    pattern: routes.customerDetail,
    icon: CircleUserRound,
    breadcrumbs: () => [{ label: "Customer" }],
  },
  {
    pattern: routes.customers,
    icon: CircleUserRound,
    breadcrumbs: () => [{ label: "Customers" }],
  },
  {
    pattern: routes.developmentBuyerRegistration,
    icon: UserCircle2Icon,
    breadcrumbs: (params) => [
      { label: "Dashboard", to: routes.dashboard },
      { label: "Empreendimentos", to: routes.developments },
      params.developmentId
        ? { label: "Empreendimento", to: routes.developmentDetailById(params.developmentId) }
        : { label: "Empreendimento" },
      { label: "Novo comprador" },
    ],
    actions: (params) => [
      {
        label: "Voltar para empreendimento",
        to: params.developmentId
          ? routes.developmentDetailById(params.developmentId)
          : routes.developments,
        variant: "outline",
      },
    ],
  },
  {
    pattern: routes.supplierDevelopmentBuyerProcessDetail,
    icon: GitBranchIcon,
    breadcrumbs: (params) => [
      params.supplierId
        ? { label: "Cliente", to: routes.supplierDetailById(params.supplierId) }
        : { label: "Cliente" },
      params.supplierId && params.developmentId
        ? {
            label: "Empreendimento",
            to: routes.supplierDevelopmentDetailById(params.supplierId, params.developmentId),
          }
        : { label: "Compradores" },
      params.supplierId && params.developmentId && params.buyerId
        ? {
            label: "Comprador",
            to: routes.supplierDevelopmentBuyerDetailById(
              params.supplierId,
              params.developmentId,
              params.buyerId,
            ),
          }
        : { label: "Comprador" },
      { label: "Processo" },
    ],
  },
  {
    pattern: routes.supplierDevelopmentBuyerDetail,
    icon: UserCircle2Icon,
    breadcrumbs: (params) => [
      params.supplierId
        ? { label: "Cliente", to: routes.supplierDetailById(params.supplierId) }
        : { label: "Cliente" },
      params.supplierId && params.developmentId
        ? {
            label: "Empreendimento",
            to: routes.supplierDevelopmentDetailById(params.supplierId, params.developmentId),
          }
        : { label: "Empreendimento" },
      params.supplierId && params.developmentId
        ? {
            label: "Compradores",
            to: routes.supplierDevelopmentBuyersById(params.supplierId, params.developmentId),
          }
        : { label: "Compradores" },
      { label: "Comprador" },
    ],
  },
  {
    pattern: routes.supplierDevelopmentBuyers,
    icon: UserCircle2Icon,
    breadcrumbs: (params) => [
      params.supplierId
        ? { label: "Cliente", to: routes.supplierDetailById(params.supplierId) }
        : { label: "Cliente" },
      params.supplierId && params.developmentId
        ? {
            label: "Empreendimento",
            to: routes.supplierDevelopmentDetailById(params.supplierId, params.developmentId),
          }
        : { label: "Empreendimento" },
      { label: "Compradores" },
    ],
  },
  {
    pattern: routes.supplierDevelopmentDetail,
    icon: FolderKanban,
    breadcrumbs: () => [{ label: "Empreendimento" }],
  },
  {
    pattern: routes.buyerDetail,
    icon: UserCircle2Icon,
    breadcrumbs: () => [{ label: "Comprador" }],
    actions: () => [{ label: "Lista de compradores", to: routes.buyers, variant: "outline" }],
  },
  {
    pattern: routes.buyers,
    icon: UserCircle2Icon,
    breadcrumbs: () => [{ label: "Compradores" }],
    actions: () => [{ label: "Empreendimentos", to: routes.developments, variant: "outline" }],
  },
  {
    pattern: routes.developmentRegistration,
    icon: FolderKanban,
    breadcrumbs: () => [
      { label: "Dashboard", to: routes.dashboard },
      { label: "Empreendimentos", to: routes.developments },
      { label: "Cadastrar" },
    ],
    actions: () => [
      { label: "Lista de empreendimentos", to: routes.developments, variant: "outline" },
    ],
  },
  {
    pattern: routes.supplierDevelopments,
    icon: FolderKanban,
    breadcrumbs: () => [{ label: "Empreendimentos" }],
  },
  {
    pattern: routes.developmentDetail,
    icon: FolderKanban,
    breadcrumbs: () => [{ label: "Empreendimento" }],
    actions: (params) => [
      ...(params.developmentId
        ? [
            {
              label: "Novo comprador",
              to: routes.developmentBuyerRegistrationById(params.developmentId),
              variant: "default" as const,
            },
          ]
        : []),
    ],
  },
  {
    pattern: routes.developments,
    icon: FolderKanban,
    breadcrumbs: () => [{ label: "Empreendimentos" }],
    actions: () => [{ label: "Cadastrar empreendimento", to: routes.developmentRegistration }],
  },
  {
    pattern: routes.supplierDetail,
    icon: Building2Icon,
    breadcrumbs: () => [{ label: "Cliente" }],
    actions: () => [{ label: "Empreendimentos", to: routes.developments, variant: "outline" }],
  },
  {
    pattern: routes.suppliers,
    icon: Building2Icon,
    breadcrumbs: () => [{ label: "Clientes" }],
    showNotifications: false,
  },
  {
    pattern: routes.supplierBuyers,
    icon: UserCircle2Icon,
    breadcrumbs: () => [{ label: "Compradores" }],
  },
  {
    pattern: routes.supplierProcesses,
    icon: GitBranchIcon,
    breadcrumbs: () => [{ label: "Processos" }],
  },
  {
    pattern: routes.supplierRequests,
    icon: ListTreeIcon,
    breadcrumbs: () => [{ label: "Solicitações" }],
  },
  {
    pattern: routes.supplierTasks,
    icon: ClipboardList,
    breadcrumbs: () => [{ label: "Tarefas" }],
  },
  {
    pattern: routes.supplierDocuments,
    icon: FileTextIcon,
    breadcrumbs: () => [{ label: "Documentos" }],
  },
  {
    pattern: routes.supplierRequirements,
    icon: ShieldCheckIcon,
    breadcrumbs: () => [{ label: "Exigências" }],
  },
  {
    pattern: routes.processDetail,
    icon: GitBranchIcon,
    breadcrumbs: () => [{ label: "Processo" }],
    actions: () => [{ label: "Lista de processos", to: routes.processes, variant: "outline" }],
  },
  {
    pattern: routes.requests,
    icon: ListTreeIcon,
    breadcrumbs: () => [{ label: "Dashboard", to: routes.dashboard }, { label: "Solicitações" }],
    actions: () => [{ label: "Processos", to: routes.processes, variant: "outline" }],
  },
  {
    pattern: routes.tasks,
    icon: ClipboardList,
    breadcrumbs: () => [{ label: "Dashboard", to: routes.dashboard }, { label: "Tarefas" }],
    actions: () => [{ label: "Processos", to: routes.processes, variant: "outline" }],
  },
  {
    pattern: routes.documents,
    icon: FileTextIcon,
    breadcrumbs: () => [{ label: "Dashboard", to: routes.dashboard }, { label: "Documentos" }],
    actions: () => [{ label: "Processos", to: routes.processes, variant: "outline" }],
  },
  {
    pattern: routes.requirements,
    icon: ShieldCheckIcon,
    breadcrumbs: () => [{ label: "Dashboard", to: routes.dashboard }, { label: "Exigências" }],
    actions: () => [{ label: "Processos", to: routes.processes, variant: "outline" }],
  },
  {
    pattern: routes.settings,
    icon: Settings2Icon,
    breadcrumbs: () => [{ label: "Configurações" }],
    actions: () => [{ label: "Usuários", to: routes.backofficeUsers, variant: "outline" }],
  },
  {
    pattern: routes.workflowList,
    icon: ScrollText,
    breadcrumbs: () => [{ label: "Fluxos" }],
  },
  {
    pattern: routes.processes,
    icon: GitBranchIcon,
    breadcrumbs: () => [{ label: "Processos" }],
    actions: () => [{ label: "Solicitações", to: routes.requests, variant: "outline" }],
  },
  {
    pattern: routes.dashboard,
    icon: LayoutDashboardIcon,
    breadcrumbs: () => [{ label: "Dashboard" }],
    showNotifications: false,
  },
];

export function ProtectedLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  const navigate = useNavigate();
  const { isAuthenticated, logout, session } = useAuth();
  const workspaceQuery = useOperationsWorkspaceQuery();
  const [workspaceSidebar, setWorkspaceSidebar] = useState<ContextSidebarConfig | null>(null);
  const [pageHeader, setPageHeader] = useState<PageHeaderConfig | null>(null);

  const shellNavigation =
    shellRouteMeta.find((item) =>
      matchPath({ path: item.pattern, end: true }, location.pathname),
    ) ?? shellRouteMeta[shellRouteMeta.length - 1];

  const matchedParams =
    matchPath({ path: shellNavigation.pattern, end: true }, location.pathname)?.params ?? {};
  const supplierWorkspaceId = matchPath(
    "/suppliers/:supplierId/*",
    location.pathname,
  )?.params?.["supplierId"];
  const derivedContextSidebar = useMemo(() => {
    if (!supplierWorkspaceId) {
      return null;
    }

    const supplier =
      workspaceQuery.data?.suppliers.find((item) => item.id === supplierWorkspaceId) ?? null;

    if (!supplier) {
      return null;
    }

    return buildSupplierWorkspaceSidebar({
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierCnpj: supplier.cnpj,
    });
  }, [supplierWorkspaceId, workspaceQuery.data?.suppliers]);

  return (
    <WorkspaceSidebarProvider sidebar={workspaceSidebar} setSidebar={setWorkspaceSidebar}>
      <PageHeaderProvider header={pageHeader} setHeader={setPageHeader}>
        <PortalAppShell
          isAuthenticated={isAuthenticated}
          loginRoute={routes.login}
          portalName={portalConfig.name}
          searchPlaceholder="Buscar cliente, empreendimento, comprador ou processo"
          sections={sections}
          contextSidebar={derivedContextSidebar}
          breadcrumbs={shellNavigation.breadcrumbs(matchedParams)}
          headerIcon={shellNavigation.icon}
          headerTitle={pageHeader?.title}
          headerDescription={pageHeader?.description}
          headerActions={pageHeader?.actions ?? shellNavigation.actions?.(matchedParams)}
          showHeaderNotifications={
            pageHeader?.showNotifications ?? shellNavigation.showNotifications ?? true
          }
          configItems={[
            { label: "Configurações", onClick: () => navigate(routes.settings) },
            { label: "Usuários", onClick: () => navigate(routes.backofficeUsers) },
          ]}
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
          <div key={location.pathname}>{outlet}</div>
        </PortalAppShell>
      </PageHeaderProvider>
    </WorkspaceSidebarProvider>
  );
}
