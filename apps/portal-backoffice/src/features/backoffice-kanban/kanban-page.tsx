import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { Skeleton } from "@registra/ui";

import { buildSupplierWorkspaceSidebar } from "@/features/registration-core/core/workspace-sidebar";
import { routes } from "@/shared/constants/routes";
import { useRegisterPageHeader } from "@/shared/hooks/use-register-page-header";
import { useSupplierDetailQuery } from "@/features/suppliers/hooks/use-supplier-detail-query";
import { useRegisterWorkspaceSidebar } from "@/shared/hooks/use-register-workspace-sidebar";

import { FiltersBar } from "./components/filters-bar";
import { KanbanBoard } from "./components/kanban-board";
import { KanbanHeader } from "./components/kanban-header";
import type { KanbanBuyer, KanbanStage, KanbanStatus } from "./components/kanban-types";

const mockBuyers: KanbanBuyer[] = [
  {
    id: "kanban-1",
    buyerId: "buyer-1",
    processId: "proc-1",
    supplierId: "sup-1",
    developmentId: "dev-1",
    name: "Maria Oliveira",
    empreendimento: "Residencial Aurora",
    stage: "certificado",
    status: "pending",
    lastUpdate: "2026-03-24T10:00:00.000Z",
    responsible: "Julia Martins",
  },
  {
    id: "kanban-2",
    buyerId: "buyer-2",
    processId: "proc-2",
    supplierId: "sup-1",
    developmentId: "dev-1",
    name: "João Henrique",
    empreendimento: "Residencial Aurora",
    stage: "certificado",
    status: "in_analysis",
    lastUpdate: "2026-03-28T13:00:00.000Z",
    responsible: "Camila Duarte",
  },
  {
    id: "kanban-3",
    buyerId: "buyer-3",
    processId: "proc-3",
    supplierId: "sup-2",
    developmentId: "dev-2",
    name: "Fernanda Alves",
    empreendimento: "Parque das Águas",
    stage: "contrato",
    status: "approved",
    lastUpdate: "2026-03-26T09:30:00.000Z",
    responsible: "Renato Castro",
  },
  {
    id: "kanban-4",
    buyerId: "buyer-4",
    processId: "proc-4",
    supplierId: "sup-2",
    developmentId: "dev-3",
    name: "Carlos Mendes",
    empreendimento: "Lote 08 - Jardim do Lago",
    stage: "contrato",
    status: "rejected",
    lastUpdate: "2026-03-22T14:10:00.000Z",
    responsible: "Julia Martins",
  },
  {
    id: "kanban-5",
    buyerId: "buyer-5",
    processId: "proc-5",
    supplierId: "sup-1",
    developmentId: "dev-4",
    name: "Beatriz Nogueira",
    empreendimento: "Bosque Central",
    stage: "registro",
    status: "approved",
    lastUpdate: "2026-03-27T08:15:00.000Z",
    responsible: "Renata Castro",
  },
  {
    id: "kanban-6",
    buyerId: "buyer-6",
    processId: "proc-6",
    supplierId: "sup-3",
    developmentId: "dev-5",
    name: "Eduardo Lima",
    empreendimento: "Vista Park",
    stage: "registro",
    status: "in_analysis",
    lastUpdate: "2026-03-20T11:20:00.000Z",
    responsible: "Camila Duarte",
  },
];

async function fetchKanbanBuyers() {
  await new Promise((resolve) => window.setTimeout(resolve, 350));
  return mockBuyers;
}

function getDaysStuck(lastUpdate: string) {
  const now = new Date();
  const then = new Date(lastUpdate);
  const diff = now.getTime() - then.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function KanbanPage() {
  const { supplierId } = useParams<{ supplierId?: string }>();
  const { supplierQuery } = useSupplierDetailQuery();
  const [buyers, setBuyers] = useState<KanbanBuyer[]>([]);
  const [search, setSearch] = useState("");
  const [empreendimento, setEmpreendimento] = useState("all");
  const [status, setStatus] = useState<"all" | KanbanStatus>("all");
  const deferredSearch = useDeferredValue(search);
  const supplier = supplierId ? supplierQuery.data ?? null : null;

  const buyersQuery = useQuery({
    queryKey: ["backoffice-kanban", supplierId ?? "all"],
    queryFn: fetchKanbanBuyers,
  });

  useEffect(() => {
    if (buyersQuery.data) {
      setBuyers(buyersQuery.data);
    }
  }, [buyersQuery.data]);

  const workspaceSidebar = useMemo(() => {
    if (!supplierId) {
      return null;
    }

    return buildSupplierWorkspaceSidebar({
      supplierId,
      supplierName: supplier?.legalName ?? `Supplier #${supplierId}`,
      supplierCnpj: supplier?.cnpj ?? "",
    });
  }, [supplier?.cnpj, supplier?.legalName, supplierId]);

  useRegisterWorkspaceSidebar(workspaceSidebar);
  useRegisterPageHeader({
    title: supplier ? `Processos de ${supplier.legalName}` : "Processos",
    description: supplier
      ? supplier.cnpj
      : "Acompanhe onde cada processo está e identifique gargalos operacionais.",
    actions: supplierId
      ? [
          {
            label: "Ver cliente",
            to: routes.supplierDetailById(supplierId),
            variant: "outline",
          },
        ]
      : undefined,
  });

  const scopedBuyers = useMemo(
    () => (supplierId ? buyers.filter((buyer) => buyer.supplierId === supplierId) : buyers),
    [buyers, supplierId],
  );

  const empreendimentoOptions = useMemo(
    () => Array.from(new Set(scopedBuyers.map((buyer) => buyer.empreendimento))).sort(),
    [scopedBuyers],
  );

  const filteredBuyers = useMemo(
    () =>
      scopedBuyers.filter((buyer) => {
        const matchesSearch =
          deferredSearch.trim().length === 0 ||
          buyer.name.toLowerCase().includes(deferredSearch.trim().toLowerCase());
        const matchesEmpreendimento =
          empreendimento === "all" || buyer.empreendimento === empreendimento;
        const matchesStatus = status === "all" || buyer.status === status;

        return matchesSearch && matchesEmpreendimento && matchesStatus;
      }),
    [deferredSearch, empreendimento, scopedBuyers, status],
  );

  const blockedCount = filteredBuyers.filter(
    (buyer) => buyer.status === "pending" || buyer.status === "rejected",
  ).length;
  const delayedCount = filteredBuyers.filter((buyer) => getDaysStuck(buyer.lastUpdate) > 3).length;
  const averageStageTime =
    filteredBuyers.length === 0
      ? 0
      : Math.round(
          filteredBuyers.reduce((sum, buyer) => sum + getDaysStuck(buyer.lastUpdate), 0) /
            filteredBuyers.length,
        );

  return (
    <section className="space-y-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <KanbanHeader
          total={filteredBuyers.length}
          blockedCount={blockedCount}
          delayedCount={delayedCount}
          averageStageTime={averageStageTime}
        />

        <FiltersBar
          search={search}
          empreendimento={empreendimento}
          status={status}
          total={filteredBuyers.length}
          empreendimentoOptions={empreendimentoOptions}
          onSearchChange={setSearch}
          onEmpreendimentoChange={setEmpreendimento}
          onStatusChange={(value) => setStatus(value as "all" | KanbanStatus)}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl">
        {buyersQuery.isPending ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-[420px] rounded-2xl" />
            <Skeleton className="h-[420px] rounded-2xl" />
            <Skeleton className="h-[420px] rounded-2xl" />
          </div>
        ) : (
          <KanbanBoard buyers={filteredBuyers} />
        )}
      </div>
    </section>
  );
}
