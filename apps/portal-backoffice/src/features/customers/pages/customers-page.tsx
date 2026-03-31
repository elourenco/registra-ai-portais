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
import type { CustomerListStatusFilter } from "@registra/shared";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { CustomersTable } from "@/features/customers/components/customers-table";
import { useCustomerListFilters } from "@/features/customers/hooks/use-customer-list-filters";
import { useCustomersQuery } from "@/features/customers/hooks/use-customers-query";
import { customerStatusOptions } from "@/features/customers/utils/customer-status-options";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { routes } from "@/shared/constants/routes";
import { useUnauthorizedSessionRedirect } from "@/shared/hooks/use-unauthorized-session-redirect";
import { isUnauthorizedError } from "@/shared/api/query-retry";
import { getPaginationSummary } from "@/shared/utils/pagination";

export function CustomersPage() {
  const navigate = useNavigate();
  const {
    filters,
    page,
    resetFilters,
    searchInput,
    setPage,
    setSearchInput,
    setStatusFilter,
    statusFilter,
  } = useCustomerListFilters();
  const customersQuery = useCustomersQuery(filters);

  const items = customersQuery.data?.items ?? [];
  const pagination = customersQuery.data?.pagination;

  useEffect(() => {
    if (pagination && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination]);

  useUnauthorizedSessionRedirect(
    customersQuery.isError && isUnauthorizedError(customersQuery.error),
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
              <CardTitle>Base de customers</CardTitle>
              <CardDescription>{totalItems} registros encontrados.</CardDescription>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => customersQuery.refetch()}
              disabled={customersQuery.isFetching}
            >
              Atualizar
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.currentTarget.value)}
              placeholder="Buscar por nome, e-mail ou documento"
              aria-label="Buscar customer"
            />

            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as CustomerListStatusFilter)}
              aria-label="Filtrar por status"
            >
              {customerStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Button type="button" variant="outline" onClick={resetFilters}>
              Limpar filtros
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {customersQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          ) : null}

          {customersQuery.isError ? (
            <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              <p>
                {getApiErrorMessage(
                  customersQuery.error,
                  "Não foi possível carregar a lista de customers.",
                )}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => customersQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : null}

          {!customersQuery.isPending && !customersQuery.isError && items.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              <p>Nenhum customer encontrado para os filtros aplicados.</p>
              <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                Limpar filtros
              </Button>
            </div>
          ) : null}

          {!customersQuery.isPending && !customersQuery.isError && items.length > 0 ? (
            <div className="space-y-3">
              <CustomersTable
                items={items}
                onViewCustomer={(customerId) => navigate(routes.customerDetailById(customerId))}
              />

              <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Exibindo {startItem}-{endItem} de {totalItems}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                    disabled={!pagination?.hasPreviousPage || customersQuery.isFetching}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((currentPage) => currentPage + 1)}
                    disabled={!pagination?.hasNextPage || customersQuery.isFetching}
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
