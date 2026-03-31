import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Skeleton,
} from "@registra/ui";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { SuppliersTable } from "@/features/suppliers/components/suppliers-table";
import { useSupplierListFilters } from "@/features/suppliers/hooks/use-supplier-list-filters";
import { supplierStatusOptions } from "@/features/suppliers/utils/supplier-status-options";
import { useSuppliersQuery } from "@/features/suppliers/hooks/use-suppliers-query";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { isUnauthorizedError } from "@/shared/api/query-retry";
import { routes } from "@/shared/constants/routes";
import { useUnauthorizedSessionRedirect } from "@/shared/hooks/use-unauthorized-session-redirect";
import { getPaginationSummary } from "@/shared/utils/pagination";

export function SuppliersPage() {
  const navigate = useNavigate();
  const {
    applyFilters,
    cnpjInput,
    filters,
    nameInput,
    page,
    resetFilters,
    setCnpjInput,
    setNameInput,
    setPage,
    setStatusFilter,
    statusFilter,
  } = useSupplierListFilters();
  const suppliersQuery = useSuppliersQuery(filters.page, filters.limit, {
    cnpj: filters.cnpj,
    name: filters.name,
    status: filters.status === "all" ? undefined : filters.status,
  });

  const items = suppliersQuery.data?.items ?? [];
  const pagination = suppliersQuery.data?.pagination;

  useEffect(() => {
    if (pagination && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination]);

  useUnauthorizedSessionRedirect(
    suppliersQuery.isError && isUnauthorizedError(suppliersQuery.error),
  );

  const { endItem, startItem, totalItems } = getPaginationSummary(pagination, items.length);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <Card className="border-border/70 bg-card shadow-sm">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Base de clientes</CardTitle>
              <CardDescription>{totalItems} registros encontrados.</CardDescription>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => suppliersQuery.refetch()}
              disabled={suppliersQuery.isFetching}
            >
              Atualizar
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_220px_auto_auto]">
            <Input
              value={nameInput}
              onChange={(event) => setNameInput(event.currentTarget.value)}
              placeholder="Nome da empresa"
              aria-label="Filtrar por nome"
            />
            <Input
              value={cnpjInput}
              onChange={(event) => setCnpjInput(event.currentTarget.value)}
              placeholder="CNPJ"
              aria-label="Filtrar por CNPJ"
            />
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.currentTarget.value as typeof statusFilter)}
              aria-label="Filtrar por status"
            >
              {supplierStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Button type="button" onClick={applyFilters} disabled={suppliersQuery.isFetching}>
              Filtrar
            </Button>
            <Button type="button" variant="outline" onClick={resetFilters}>
              Limpar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">

          {suppliersQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
            </div>
          ) : null}

          {suppliersQuery.isError ? (
            <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              <p>
                {getApiErrorMessage(
                  suppliersQuery.error,
                  "Não foi possível carregar a lista de clientes.",
                )}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => suppliersQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : null}

          {!suppliersQuery.isPending && !suppliersQuery.isError && items.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Nenhum cliente encontrado.
            </p>
          ) : null}

          {!suppliersQuery.isPending && !suppliersQuery.isError && items.length > 0 ? (
            <div className="space-y-3">
              <SuppliersTable
                items={items}
                onViewSupplier={(supplierId) => navigate(routes.supplierDetailById(supplierId))}
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
                    disabled={!pagination?.hasPreviousPage || suppliersQuery.isFetching}
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
                    disabled={!pagination?.hasNextPage || suppliersQuery.isFetching}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.section>
  );
}
