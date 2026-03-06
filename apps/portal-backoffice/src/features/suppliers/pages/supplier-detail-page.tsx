import { formatCnpj } from "@registra/shared";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@registra/ui";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SupplierInfoItem } from "@/features/suppliers/components/supplier-info-item";
import { SupplierProcessesTable } from "@/features/suppliers/components/supplier-processes-table";
import { SupplierStatusBadge } from "@/features/suppliers/components/supplier-status-badge";
import { useSupplierDetailQuery } from "@/features/suppliers/hooks/use-supplier-detail-query";
import { useSupplierProcessesQuery } from "@/features/suppliers/hooks/use-supplier-processes-query";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { isUnauthorizedError } from "@/shared/api/query-retry";
import { routes } from "@/shared/constants/routes";
import { useUnauthorizedSessionRedirect } from "@/shared/hooks/use-unauthorized-session-redirect";
import { formatDateTime } from "@/shared/utils/format-date-time";
import { getPaginationSummary } from "@/shared/utils/pagination";

const PROCESS_PAGE_SIZE = 5;

export function SupplierDetailPage() {
  const navigate = useNavigate();
  const [processPage, setProcessPage] = useState(1);
  const { supplierId, supplierQuery } = useSupplierDetailQuery();
  const processesQuery = useSupplierProcessesQuery(supplierId, processPage, PROCESS_PAGE_SIZE);

  const processItems = processesQuery.data?.items ?? [];
  const processPagination = processesQuery.data?.pagination;

  useUnauthorizedSessionRedirect(
    (supplierQuery.isError && isUnauthorizedError(supplierQuery.error)) ||
      (processesQuery.isError && isUnauthorizedError(processesQuery.error)),
  );

  useEffect(() => {
    if (processPagination && processPage > processPagination.totalPages) {
      setProcessPage(processPagination.totalPages);
    }
  }, [processPage, processPagination]);

  if (!supplierId) {
    return (
      <Card className="border-rose-200 bg-rose-50/60">
        <CardHeader>
          <CardTitle className="text-rose-700">Supplier inválido</CardTitle>
          <CardDescription className="text-rose-700/90">
            O identificador informado não é válido para consulta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={() => navigate(routes.suppliers)}>
            Voltar para a lista
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (supplierQuery.isPending) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-10 w-48 rounded-md" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </section>
    );
  }

  if (supplierQuery.isError) {
    return (
      <Card className="border-rose-200 bg-rose-50/60">
        <CardHeader>
          <CardTitle className="text-rose-700">Falha ao carregar supplier</CardTitle>
          <CardDescription className="text-rose-700/90">
            {getApiErrorMessage(
              supplierQuery.error,
              "Não foi possível buscar os dados do supplier selecionado.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => supplierQuery.refetch()}>
            Tentar novamente
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(routes.suppliers)}>
            Voltar para a lista
          </Button>
        </CardContent>
      </Card>
    );
  }

  const supplier = supplierQuery.data;
  const {
    endItem: processEndItem,
    startItem: processStartItem,
    totalItems: processTotalItems,
  } = getPaginationSummary(processPagination, processItems.length);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold">{supplier.legalName}</h2>
            <SupplierStatusBadge status={supplier.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            ID {supplier.id} · Cadastro em {formatDateTime(supplier.createdAt)}
          </p>
        </div>

        <Button type="button" variant="outline" onClick={() => navigate(routes.suppliers)}>
          Voltar para clientes
        </Button>
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Resumo do supplier</CardTitle>
          <CardDescription>Informações principais para atendimento e operação.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SupplierInfoItem label="CNPJ" value={formatCnpj(supplier.cnpj)} />
          <SupplierInfoItem label="Nome fantasia" value={supplier.tradeName} />
          <SupplierInfoItem label="Contato" value={supplier.contactName} />
          <SupplierInfoItem label="E-mail" value={supplier.email} />
          <SupplierInfoItem label="Telefone" value={supplier.phone} />
          <SupplierInfoItem label="Workflow" value={supplier.workflowName} />
          <SupplierInfoItem
            label="Localidade"
            value={
              supplier.city || supplier.state
                ? [supplier.city, supplier.state].filter(Boolean).join(" - ")
                : null
            }
          />
          <SupplierInfoItem label="Última atualização" value={formatDateTime(supplier.updatedAt)} />
          <div className="sm:col-span-2 xl:col-span-4 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Observações
            </p>
            <p className="mt-1 text-sm text-foreground">
              {supplier.notes || "Nenhuma observação cadastrada."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="space-y-3 pb-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-lg">Processos criados</CardTitle>
            <CardDescription>{processTotalItems} processos encontrados.</CardDescription>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => processesQuery.refetch()}
            disabled={processesQuery.isFetching}
          >
            Atualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {processesQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          ) : null}

          {processesQuery.isError ? (
            <div className="space-y-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>
                {getApiErrorMessage(
                  processesQuery.error,
                  "Não foi possível carregar os processos do supplier.",
                )}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => processesQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : null}

          {!processesQuery.isPending && !processesQuery.isError && processItems.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Nenhum processo criado para este supplier.
            </p>
          ) : null}

          {!processesQuery.isPending && !processesQuery.isError && processItems.length > 0 ? (
            <div className="space-y-3">
              <SupplierProcessesTable items={processItems} />

              <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Exibindo {processStartItem}-{processEndItem} de {processTotalItems}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProcessPage((currentPage) => Math.max(1, currentPage - 1))}
                    disabled={!processPagination?.hasPreviousPage || processesQuery.isFetching}
                  >
                    Anterior
                  </Button>

                  <span className="min-w-28 text-center text-xs text-muted-foreground">
                    Página {processPagination?.page ?? processPage} de{" "}
                    {processPagination?.totalPages ?? processPage}
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProcessPage((currentPage) => currentPage + 1)}
                    disabled={!processPagination?.hasNextPage || processesQuery.isFetching}
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
