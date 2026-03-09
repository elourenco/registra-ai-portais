import { Button, Card, CardContent, Skeleton } from "@registra/ui";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SuppliersTable } from "@/features/suppliers/components/suppliers-table";
import { useSuppliersQuery } from "@/features/suppliers/hooks/use-suppliers-query";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { isUnauthorizedError } from "@/shared/api/query-retry";
import { routes } from "@/shared/constants/routes";
import { useUnauthorizedSessionRedirect } from "@/shared/hooks/use-unauthorized-session-redirect";
import { getPaginationSummary } from "@/shared/utils/pagination";

const PAGE_SIZE = 10;

export function SuppliersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const suppliersQuery = useSuppliersQuery(page, PAGE_SIZE);

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
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold">Suppliers</h2>
        <p className="text-sm text-muted-foreground">
          Todo supplier herda o workflow default quando não possui vínculo explícito.
        </p>
      </header>

      <Card className="border-slate-200/80 bg-card/95 shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="flex justify-end">
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

          {suppliersQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
            </div>
          ) : null}

          {suppliersQuery.isError ? (
            <div className="space-y-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>
                {getApiErrorMessage(
                  suppliersQuery.error,
                  "Não foi possível carregar a lista de suppliers.",
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
              Nenhum supplier encontrado.
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
