import {
  Building2Icon,
  FileTextIcon,
  GitBranchIcon,
  LayoutDashboardIcon,
  ListTreeIcon,
  PortalAppShell,
  Settings2Icon,
  ShieldCheckIcon,
  UserCircle2Icon,
  type SidebarSection,
} from "@registra/ui";
import { ClipboardList, FolderKanban, ScrollText } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import { portalConfig } from "@/shared/config/portal-config";
import { routes } from "@/shared/constants/routes";

const sections: SidebarSection[] = [
  {
    sectionLabel: "Visão geral",
    items: [
      {
        to: routes.dashboard,
        label: "Dashboard",
        description: "Visão operacional",
        icon: LayoutDashboardIcon,
      },
      {
        to: routes.suppliers,
        label: "Clientes",
        description: "Clientes da plataforma",
        icon: Building2Icon,
      },
      {
        to: routes.developments,
        label: "Empreendimentos",
        description: "Projetos por cliente",
        icon: FolderKanban,
      },
      {
        to: routes.buyers,
        label: "Compradores",
        description: "Carteira por empreendimento",
        icon: UserCircle2Icon,
      },
    ],
  },
  {
    sectionLabel: "Operação",
    items: [
      {
        to: routes.processes,
        label: "Processos",
        description: "Workflow de registro",
        icon: GitBranchIcon,
      },
      {
        to: routes.requests,
        label: "Solicitações",
        description: "Checkpoint com cliente",
        icon: ListTreeIcon,
      },
      {
        to: routes.tasks,
        label: "Tarefas",
        description: "Backlog operacional",
        icon: ClipboardList,
      },
      {
        to: routes.documents,
        label: "Documentos",
        description: "Validações e reenvio",
        icon: FileTextIcon,
      },
      {
        to: routes.requirements,
        label: "Exigências",
        description: "Apontamentos do cartório",
        icon: ShieldCheckIcon,
      },
    ],
  },
  {
    sectionLabel: "Governança",
    items: [
      {
        to: routes.settings,
        label: "Configurações",
        description: "Regras e cobrança",
        icon: Settings2Icon,
      },
      {
        to: routes.workflowList,
        label: "Fluxos",
        description: "Catálogo de regras",
        icon: ScrollText,
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
      searchPlaceholder="Buscar cliente, empreendimento, comprador ou processo"
      sections={sections}
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
      <Outlet />
    </PortalAppShell>
  );
}
