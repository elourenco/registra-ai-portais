import { Button, Card, CardContent, Input, Select, Skeleton, buttonVariants } from "@registra/ui";
import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { PageHeader, RefreshAction } from "@/features/registration-core/components/page-header";
import { buildSupplierWorkspaceSidebar } from "@/features/registration-core/core/workspace-sidebar";
import { ProcessesTable } from "@/features/processes/components/processes-table";
import type { ProcessListItem } from "@/features/processes/core/process-schema";
import { useProcessListFilters } from "@/features/processes/hooks/use-process-list-filters";
import { useProcessesQuery } from "@/features/processes/hooks/use-processes-query";
import { useSupplierDetailQuery } from "@/features/suppliers/hooks/use-supplier-detail-query";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { isUnauthorizedError } from "@/shared/api/query-retry";
import { routes } from "@/shared/constants/routes";
import { useRegisterWorkspaceSidebar } from "@/shared/hooks/use-register-workspace-sidebar";
import { useUnauthorizedSessionRedirect } from "@/shared/hooks/use-unauthorized-session-redirect";
import { getPaginationSummary } from "@/shared/utils/pagination";
const processStatusOptions = [
  { value: "all", label: "Todos os status" },
  { value: "in_progress", label: "Em andamento" },
  { value: "completed", label: "Concluído" },
  { value: "cancelled", label: "Cancelado" },
  { value: "waiting_supplier", label: "Aguardando supplier" },
  { value: "waiting_registry_office", label: "Aguardando cartório" },
  { value: "requirement_open", label: "Exigência aberta" },
  { value: "overdue", label: "Em atraso" },
] as const;

export function ProcessesPage() {
  const navigate = useNavigate();
  const { supplierId } = useParams<{ supplierId?: string }>();
  const {
    filters,
    page,
    resetFilters,
    searchInput,
    setPage,
    setSearchInput,
    setStatusFilter,
    statusFilter,
  } = useProcessListFilters();
  const processesQuery = useProcessesQuery({
    page: filters.page,
    limit: filters.limit,
    search: filters.search,
    supplierId,
    status: filters.status === "all" ? undefined : filters.status,
  });
  const { supplierQuery } = useSupplierDetailQuery();

  const supplier = supplierId ? supplierQuery.data ?? null : null;
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

  useUnauthorizedSessionRedirect(
    (processesQuery.isError && isUnauthorizedError(processesQuery.error)) ||
      (supplierQuery.isError && isUnauthorizedError(supplierQuery.error)),
  );

  const items = processesQuery.data?.items ?? [];
  const pagination = processesQuery.data?.pagination;

  useEffect(() => {
    if (pagination && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination, setPage]);

  const { endItem, startItem, totalItems } = getPaginationSummary(pagination, items.length);

  const handleViewProcess = (process: ProcessListItem) => {
    navigate(routes.processDetailById(process.id));
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title={supplier ? `Processos de ${supplier.legalName}` : "Processos"}
        description={
          supplier
            ? supplier.cnpj
            : "Acompanhe os processos reais retornados pelo workflow do backend e abra o detalhe pelo click na linha."
        }
        actions={
          <>
            <RefreshAction
              onClick={() => {
                void processesQuery.refetch();
                if (supplierId) {
                  void supplierQuery.refetch();
                }
              }}
              disabled={processesQuery.isFetching || supplierQuery.isFetching}
            />
            <Link to={routes.requests} className={buttonVariants({ variant: "outline" })}>
              Ver solicitações
            </Link>
          </>
        }
      />

      <Card className="border-slate-200/80 bg-card/95 shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_220px_auto]">
              <Input
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.currentTarget.value);
                  setPage(1);
                }}
                placeholder="Buscar por processo, workflow, etapa ou supplier"
                aria-label="Buscar processo"
                className="bg-white"
              />
              <Select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.currentTarget.value as typeof statusFilter);
                  setPage(1);
                }}
                aria-label="Filtrar por status"
                className="bg-white"
              >
                {processStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Button type="button" variant="outline" onClick={resetFilters}>
                Limpar filtros
              </Button>
            </div>
          </div>

          {processesQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
            </div>
          ) : null}

          {processesQuery.isError ? (
            <div className="space-y-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>
                {getApiErrorMessage(
                  processesQuery.error,
                  "Não foi possível carregar a lista de processos.",
                )}
              </p>
              <Button type="button" variant="secondary" size="sm" onClick={() => processesQuery.refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : null}

          {!processesQuery.isPending && !processesQuery.isError && items.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              <p>Nenhum processo encontrado para os filtros aplicados.</p>
              <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                Limpar filtros
              </Button>
            </div>
          ) : null}

          {!processesQuery.isPending && !processesQuery.isError && items.length > 0 ? (
            <div className="space-y-3">
              <ProcessesTable
                items={items}
                onViewProcess={handleViewProcess}
                showSupplierColumn={!supplierId}
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Mostrando {startItem} - {endItem} de {totalItems}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={!pagination?.hasPreviousPage || processesQuery.isFetching}
                  >
                    Anterior
                  </Button>

                  <span className="min-w-28 text-center text-xs text-muted-foreground">
                    Página {pagination?.page ?? page} de {pagination?.totalPages ?? page}
                  </span>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={!pagination?.hasNextPage || processesQuery.isFetching}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
