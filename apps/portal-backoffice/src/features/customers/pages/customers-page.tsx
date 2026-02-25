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
import {
  customerListFiltersSchema,
  type CustomerListStatusFilter,
} from "@registra/shared";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import { listCustomers } from "@/features/customers/api/customers-api";
import { CustomersTable } from "@/features/customers/components/customers-table";
import { ApiClientError, getApiErrorMessage } from "@/shared/api/http-client";
import { routes } from "@/shared/constants/routes";

const PAGE_SIZE = 10;

const statusOptions: Array<{ value: CustomerListStatusFilter; label: string }> = [
  { value: "all", label: "Todos os status" },
  { value: "active", label: "Ativo" },
  { value: "pending_review", label: "Em revisão" },
  { value: "inactive", label: "Inativo" },
  { value: "blocked", label: "Bloqueado" },
];

function useDebouncedValue<TValue>(value: TValue, waitTime: number): TValue {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, waitTime);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, waitTime]);

  return debouncedValue;
}

export function CustomersPage() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerListStatusFilter>("all");
  const debouncedSearch = useDebouncedValue(searchInput, 250);

  const filters = useMemo(
    () =>
      customerListFiltersSchema.parse({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter,
      }),
    [debouncedSearch, page, statusFilter],
  );

  const customersQuery = useQuery({
    queryKey: [
      "customers",
      "list",
      session?.user.id,
      filters.page,
      filters.limit,
      filters.search,
      filters.status,
    ],
    queryFn: async () => {
      if (!session?.token) {
        throw new Error("Sessão inválida para listar customers.");
      }

      return listCustomers({
        token: session.token,
        filters,
      });
    },
    enabled: Boolean(session?.token),
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && error.status === 401) {
        return false;
      }

      return failureCount < 2;
    },
  });

  const items = customersQuery.data?.items ?? [];
  const pagination = customersQuery.data?.pagination;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (pagination && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination]);

  useEffect(() => {
    if (
      customersQuery.isError &&
      customersQuery.error instanceof ApiClientError &&
      customersQuery.error.status === 401
    ) {
      logout();
      navigate(routes.login, { replace: true });
    }
  }, [customersQuery.error, customersQuery.isError, logout, navigate]);

  const startItem =
    pagination && pagination.totalItems > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endItem =
    pagination && pagination.totalItems > 0
      ? Math.min(pagination.page * pagination.limit, pagination.totalItems)
      : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold">Customers</h2>
        <p className="text-sm text-muted-foreground">
          Acompanhe clientes, status operacional e histórico de cadastro.
        </p>
      </header>

      <Card className="border-slate-200/80 bg-card/95 shadow-sm">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Base de customers</CardTitle>
              <CardDescription>
                {pagination?.totalItems ?? items.length} registros encontrados.
              </CardDescription>
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
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchInput("");
                setStatusFilter("all");
                setPage(1);
              }}
            >
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
            <div className="space-y-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>
                {getApiErrorMessage(
                  customersQuery.error,
                  "Não foi possível carregar a lista de customers.",
                )}
              </p>
              <Button type="button" variant="secondary" size="sm" onClick={() => customersQuery.refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : null}

          {!customersQuery.isPending && !customersQuery.isError && items.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              <p>Nenhum customer encontrado para os filtros aplicados.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  setStatusFilter("all");
                  setPage(1);
                }}
              >
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
                  Exibindo {startItem}-{endItem} de {pagination?.totalItems ?? items.length}
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
