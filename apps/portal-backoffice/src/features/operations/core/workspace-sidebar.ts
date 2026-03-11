import type { ContextSidebarConfig } from "@registra/ui";
import { Building2Icon } from "@registra/ui";
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
            activePatterns: [routes.supplierDetail],
          },
        ],
      },
      {
        sectionLabel: "Empreendimentos",
        items: [
          {
            to: routes.supplierDevelopmentsById(input.supplierId),
            label: "Todos empreendimentos",
            icon: FolderKanban,
            exact: true,
            activePatterns: [routes.supplierDevelopments, routes.supplierDevelopmentDetail],
          },
          {
            to: routes.supplierBuyersById(input.supplierId),
            label: "Compradores",
            exact: true,
            inset: true,
            activePatterns: [
              routes.supplierBuyers,
              routes.supplierDevelopmentBuyers,
              routes.supplierDevelopmentBuyerDetail,
              routes.supplierDevelopmentBuyerProcessDetail,
            ],
          },
        ],
      },
    ],
  };
}
