import type { ContextSidebarConfig } from "@registra/ui";
import { Building2Icon, GitBranchIcon, UserCircle2Icon } from "@registra/ui";
import { FolderKanban } from "lucide-react";

import { formatCnpj } from "@/features/operations/core/operations-presenters";
import { routes } from "@/shared/constants/routes";

export function buildSupplierWorkspaceSidebar(input: {
  supplierId: string;
  supplierName: string;
  supplierCnpj: string;
}): ContextSidebarConfig {
  return {
    title: input.supplierName,
    description: formatCnpj(input.supplierCnpj),
    sections: [
      {
        sectionLabel: "Visão do cliente",
        items: [
          {
            to: routes.supplierDetailById(input.supplierId),
            label: "Informações",
            icon: Building2Icon,
            exact: true,
          },
          {
            to: routes.supplierDevelopmentsById(input.supplierId),
            label: "Empreendimentos",
            icon: FolderKanban,
            exact: true,
          },
        ],
      },
    ],
  };
}

export function buildDevelopmentWorkspaceSidebar(input: {
  supplierId: string;
  supplierName?: string;
  developmentId: string;
  developmentName: string;
}): ContextSidebarConfig {
  return {
    title: input.developmentName,
    description: input.supplierName
      ? `Empreendimento do cliente ${input.supplierName}.`
      : "Workspace interno do empreendimento.",
    sections: [
      {
        sectionLabel: "Empreendimento",
        items: [
          ...(input.supplierName
            ? [
                {
                  to: routes.supplierDetailById(input.supplierId),
                  label: "Informações do cliente",
                  icon: Building2Icon,
                },
              ]
            : []),
          {
            to: routes.supplierDevelopmentDetailById(input.supplierId, input.developmentId),
            label: "Empreendimento",
            icon: FolderKanban,
            exact: true,
          },
          {
            to: routes.supplierDevelopmentBuyersById(input.supplierId, input.developmentId),
            label: "Compradores",
            icon: UserCircle2Icon,
            exact: true,
          },
        ],
      },
    ],
  };
}

export function buildBuyerWorkspaceSidebar(input: {
  supplierId: string;
  supplierName?: string;
  developmentId: string;
  developmentName?: string;
  buyerId: string;
  buyerName: string;
  processId?: string;
}): ContextSidebarConfig {
  return {
    title: input.buyerName,
    description: "Navegação contextual do comprador e do processo vinculado.",
    sections: [
      {
        sectionLabel: "Comprador",
        items: [
          ...(input.supplierName
            ? [
                {
                  to: routes.supplierDetailById(input.supplierId),
                  label: "Informações do cliente",
                  icon: Building2Icon,
                },
              ]
            : []),
          ...(input.developmentName
            ? [
                {
                  to: routes.supplierDevelopmentDetailById(input.supplierId, input.developmentId),
                  label: "Empreendimento",
                  icon: FolderKanban,
                },
              ]
            : []),
          {
            to: routes.supplierDevelopmentBuyerDetailById(
              input.supplierId,
              input.developmentId,
              input.buyerId,
            ),
            label: "Comprador",
            icon: UserCircle2Icon,
            exact: true,
          },
          ...(input.processId
            ? [
                {
                  to: routes.supplierDevelopmentBuyerProcessDetailById(
                    input.supplierId,
                    input.developmentId,
                    input.buyerId,
                    input.processId,
                  ),
                  label: "Processo",
                  icon: GitBranchIcon,
                },
              ]
            : []),
        ],
      },
    ],
  };
}

export function buildProcessWorkspaceSidebar(input: {
  supplierId: string;
  supplierName?: string;
  developmentId: string;
  developmentName?: string;
  buyerId: string;
  buyerName?: string;
  processId: string;
  processName: string;
}): ContextSidebarConfig {
  return {
    title: input.processName,
    description: "Workspace do processo com atalhos para toda a cadeia do registro.",
    sections: [
      {
        sectionLabel: "Processo",
        items: [
          ...(input.supplierName
            ? [
                {
                  to: routes.supplierDetailById(input.supplierId),
                  label: "Informações do cliente",
                  icon: Building2Icon,
                },
              ]
            : []),
          ...(input.developmentName
            ? [
                {
                  to: routes.supplierDevelopmentDetailById(input.supplierId, input.developmentId),
                  label: "Empreendimento",
                  icon: FolderKanban,
                },
              ]
            : []),
          ...(input.buyerName
            ? [
                {
                  to: routes.supplierDevelopmentBuyerDetailById(
                    input.supplierId,
                    input.developmentId,
                    input.buyerId,
                  ),
                  label: "Comprador",
                  icon: UserCircle2Icon,
                },
              ]
            : []),
          {
            to: routes.supplierDevelopmentBuyerProcessDetailById(
              input.supplierId,
              input.developmentId,
              input.buyerId,
              input.processId,
            ),
            label: "Processo",
            icon: GitBranchIcon,
            exact: true,
          },
        ],
      },
    ],
  };
}
