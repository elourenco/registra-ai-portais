import { Button, Card, CardContent, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, buttonVariants } from "@registra/ui";
import { type ProcessStatus } from "@registra/shared";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { PageHeader, RefreshAction } from "@/features/operations/components/page-header";
import { StatusBadge } from "@/features/operations/components/status-badge";
import {
  billingStatusLabels,
  formatCnpj,
  formatCurrency,
  formatDate,
  processStatusLabels,
} from "@/features/operations/core/operations-presenters";
import { buildSupplierWorkspaceSidebar } from "@/features/operations/core/workspace-sidebar";
import { useOperationsWorkspaceQuery } from "@/features/operations/hooks/use-operations-workspace-query";
import { routes } from "@/shared/constants/routes";
import { useRegisterWorkspaceSidebar } from "@/shared/hooks/use-register-workspace-sidebar";

const statusOptions: Array<ProcessStatus | "all"> = [
  "all",
  "active",
  "waiting_supplier",
  "waiting_registry_office",
  "requirement_open",
  "overdue",
  "completed",
  "cancelled",
];

export function ProcessesPage() {
  const { supplierId } = useParams<{ supplierId?: string }>();
  const workspaceQuery = useOperationsWorkspaceQuery();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProcessStatus | "all">("all");

  const buyerMap = useMemo(() => new Map(workspaceQuery.data?.buyers.map((item) => [item.id, item.name]) ?? []), [workspaceQuery.data?.buyers]);
  const supplierMap = useMemo(() => new Map(workspaceQuery.data?.suppliers.map((item) => [item.id, item.name]) ?? []), [workspaceQuery.data?.suppliers]);
  const supplier = useMemo(
    () => workspaceQuery.data?.suppliers.find((item) => item.id === supplierId) ?? null,
    [supplierId, workspaceQuery.data?.suppliers],
  );
  const workspaceSidebar = useMemo(() => {
    if (!supplier) {
      return null;
    }

    return buildSupplierWorkspaceSidebar({
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierCnpj: supplier.cnpj,
    });
  }, [supplier]);
  const developmentMap = useMemo(
    () => new Map(workspaceQuery.data?.developments.map((item) => [item.id, item.name]) ?? []),
    [workspaceQuery.data?.developments],
  );
  useRegisterWorkspaceSidebar(workspaceSidebar);

  const requestCountByProcessId = useMemo(() => {
    const map = new Map<string, number>();

    for (const request of workspaceQuery.data?.requests ?? []) {
      if (["created", "sent", "in_review", "resubmission_requested"].includes(request.status)) {
        map.set(request.processId, (map.get(request.processId) ?? 0) + 1);
      }
    }

    return map;
  }, [workspaceQuery.data?.requests]);

  const items = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return (workspaceQuery.data?.processes ?? []).filter((item) => {
      const matchesSupplier = supplierId ? item.supplierId === supplierId : true;
      const matchesStatus = status === "all" ? true : item.status === status;
      const matchesSearch =
        !normalizedSearch ||
        [item.propertyLabel, item.registryOffice, item.registrationNumber, buyerMap.get(item.buyerId) ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesSupplier && matchesStatus && matchesSearch;
    });
  }, [buyerMap, search, status, supplierId, workspaceQuery.data?.processes]);

  const getWaitingOnLabel = (processId: string) => {
    const pendingRequest = (workspaceQuery.data?.requests ?? []).find(
      (request) =>
        request.processId === processId &&
        ["created", "sent", "in_review", "resubmission_requested"].includes(request.status),
    );

    if (pendingRequest?.target === "buyer") {
      return "Comprador";
    }

    if (pendingRequest?.target === "supplier") {
      return "Supplier";
    }

    return "Backoffice";
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title={supplier ? `Processos de ${supplier.name}` : "Processos"}
        description={
          supplier
            ? formatCnpj(supplier.cnpj)
            : "Gerencie criação, acompanhamento e conclusão dos processos de registro com checkpoints obrigatórios por bloco."
        }
        actions={
          <>
            <RefreshAction onClick={() => workspaceQuery.refetch()} disabled={workspaceQuery.isFetching} />
            <Button type="button" size="sm">Criar processo</Button>
          </>
        }
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
            <Input value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="Buscar por imóvel, comprador ou matrícula" />
            <Select value={status} onChange={(event) => setStatus(event.currentTarget.value as ProcessStatus | "all")}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "Todos os status" : processStatusLabels[option]}
                </option>
              ))}
            </Select>
            <Button type="button" variant="outline" onClick={() => { setSearch(""); setStatus("all"); }}>
              Limpar filtros
            </Button>
            <Link to={routes.requests} className={buttonVariants({ variant: "outline" })}>
              Ver solicitações
            </Link>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Empreendimento</TableHead>
                <TableHead>Imóvel</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead>Etapa atual</TableHead>
                <TableHead>Aguardando quem</TableHead>
                <TableHead>Pendências</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cobrança</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="text-right">Detalhe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{supplierMap.get(item.supplierId) ?? "-"}</TableCell>
                  <TableCell>{developmentMap.get(item.developmentId) ?? "-"}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.propertyLabel}</p>
                      <p className="text-xs text-muted-foreground">{item.registrationNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>{buyerMap.get(item.buyerId) ?? "-"}</TableCell>
                  <TableCell>{item.currentStep}</TableCell>
                  <TableCell>{getWaitingOnLabel(item.id)}</TableCell>
                  <TableCell>{requestCountByProcessId.get(item.id) ?? 0}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} label={processStatusLabels[item.status]} />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <p>{formatCurrency(item.billing.unitValue)}</p>
                      <StatusBadge status={item.billing.status} label={billingStatusLabels[item.billing.status]} />
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(item.dueAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={
                        supplierId
                          ? routes.supplierDevelopmentBuyerProcessDetailById(
                              item.supplierId,
                              item.developmentId,
                              item.buyerId,
                              item.id,
                            )
                          : routes.processDetailById(item.id)
                      }
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Abrir
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
