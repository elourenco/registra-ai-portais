import { formatCnpj, type Development } from "@registra/shared";
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
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useRegistrationWorkspaceQuery } from "@/features/registration-core/hooks/use-registration-workspace-query";
import { SupplierDevelopmentBuyersSheet } from "@/features/suppliers/components/supplier-development-buyers-sheet";
import { SupplierDevelopmentsTable } from "@/features/suppliers/components/supplier-developments-table";
import {
  SupplierDetailTabs,
  type SupplierDetailTab,
} from "@/features/suppliers/components/supplier-detail-tabs";
import { SupplierInfoItem } from "@/features/suppliers/components/supplier-info-item";
import { SupplierInternalUsersTable } from "@/features/suppliers/components/supplier-internal-users-table";
import { SupplierProcessesTable } from "@/features/suppliers/components/supplier-processes-table";
import { useSupplierDetailQuery } from "@/features/suppliers/hooks/use-supplier-detail-query";
import { useSupplierProcessesQuery } from "@/features/suppliers/hooks/use-supplier-processes-query";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { isUnauthorizedError } from "@/shared/api/query-retry";
import { routes } from "@/shared/constants/routes";
import { useRegisterPageHeader } from "@/shared/hooks/use-register-page-header";
import { useUnauthorizedSessionRedirect } from "@/shared/hooks/use-unauthorized-session-redirect";
import { formatDateTime } from "@/shared/utils/format-date-time";
import { getPaginationSummary } from "@/shared/utils/pagination";

const PROCESS_PAGE_SIZE = 5;

export function SupplierDetailPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SupplierDetailTab>("developments");
  const [processPage, setProcessPage] = useState(1);
  const [selectedDevelopment, setSelectedDevelopment] = useState<Development | null>(null);
  const { supplierId, supplierQuery } = useSupplierDetailQuery();
  const workspaceQuery = useRegistrationWorkspaceQuery();
  const processesQuery = useSupplierProcessesQuery(supplierId, processPage, PROCESS_PAGE_SIZE);

  const processItems = useMemo(
    () =>
      (processesQuery.data?.items ?? []).filter(
        (item) => item.status !== "completed" && item.status !== "cancelled",
      ),
    [processesQuery.data?.items],
  );
  const processPagination = processesQuery.data?.pagination;
  const supplier = supplierQuery.data;
  const developments = useMemo(
    () =>
      (workspaceQuery.data?.developments ?? []).filter((item) =>
        supplierId ? item.supplierId === supplierId : true,
      ),
    [supplierId, workspaceQuery.data?.developments],
  );
  const selectedDevelopmentBuyers = useMemo(
    () =>
      selectedDevelopment
        ? (workspaceQuery.data?.buyers ?? []).filter((buyer) => buyer.developmentId === selectedDevelopment.id)
        : [],
    [selectedDevelopment, workspaceQuery.data?.buyers],
  );
  const selectedDevelopmentProcesses = useMemo(
    () =>
      selectedDevelopment
        ? (workspaceQuery.data?.processes ?? []).filter(
            (process) => process.developmentId === selectedDevelopment.id,
          )
        : [],
    [selectedDevelopment, workspaceQuery.data?.processes],
  );

  useUnauthorizedSessionRedirect(
    (supplierQuery.isError && isUnauthorizedError(supplierQuery.error)) ||
      (processesQuery.isError && isUnauthorizedError(processesQuery.error)),
  );

  useRegisterPageHeader(
    supplier
      ? {
          title: supplier.legalName,
          description: "",
          actions: [],
          leadingAction: {
            ariaLabel: "Voltar para clientes",
            onClick: () => navigate(routes.suppliers),
          },
        }
      : null,
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
          <CardTitle className="text-rose-700">Cliente inválido</CardTitle>
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
          <CardTitle className="text-rose-700">Falha ao carregar cliente</CardTitle>
          <CardDescription className="text-rose-700/90">
            {getApiErrorMessage(
              supplierQuery.error,
              "Não foi possível buscar os dados do cliente selecionado.",
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

  const resolvedSupplier = supplierQuery.data!;

  const {
    endItem: processEndItem,
    startItem: processStartItem,
    totalItems: processTotalItems,
  } = getPaginationSummary(processPagination, processItems.length);
  const workflowLabel =
    resolvedSupplier.workflowName ??
    (resolvedSupplier.workflowId ? "Workflow customizado" : "Workflow default");
  const internalUsers = resolvedSupplier.internalUsers;
  const handleEditDevelopment = (development: Development) => {
    if (!supplierId) {
      return;
    }

    navigate(routes.supplierDevelopmentDetailById(supplierId, development.id));
  };

  const handleViewDevelopmentBuyers = (development: Development) => {
    setSelectedDevelopment(development);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <SupplierDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "developments" ? (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Empreendimentos</h2>
            <p className="text-sm text-muted-foreground">
              Base estrutural cadastrada pelo cliente para originar e acompanhar a carteira.
            </p>
          </div>

          {developments.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Nenhum empreendimento encontrado para este cliente.
            </p>
          ) : (
            <SupplierDevelopmentsTable
              items={developments}
              onEditDevelopment={handleEditDevelopment}
              onViewBuyers={handleViewDevelopmentBuyers}
            />
          )}
        </section>
      ) : null}

      {activeTab === "processes" ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Processos abertos</h2>
              <p className="text-sm text-muted-foreground">
                Fluxos operacionais em andamento para este cliente e seus empreendimentos.
              </p>
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
          </div>

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
                  "Não foi possível carregar os processos do cliente.",
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
              Nenhum processo aberto para este cliente.
            </p>
          ) : null}

          {!processesQuery.isPending && !processesQuery.isError && processItems.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>{processTotalItems} processo(s) aberto(s) encontrado(s).</p>
              </div>
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
        </section>
      ) : null}

      {activeTab === "settings" ? (
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Configuração</h2>
            <p className="text-sm text-muted-foreground">
              Dados cadastrais e acessos internos usados para operar a carteira deste cliente.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SupplierInfoItem label="CNPJ" value={formatCnpj(resolvedSupplier.cnpj)} />
            <SupplierInfoItem label="Nome fantasia" value={resolvedSupplier.tradeName} />
            <SupplierInfoItem label="Contato" value={resolvedSupplier.contactName} />
            <SupplierInfoItem label="E-mail" value={resolvedSupplier.email} />
            <SupplierInfoItem label="Telefone" value={resolvedSupplier.phone} />
            <SupplierInfoItem label="Workflow" value={workflowLabel} />
            <SupplierInfoItem
              label="Localidade"
              value={
                resolvedSupplier.city || resolvedSupplier.state
                  ? [resolvedSupplier.city, resolvedSupplier.state].filter(Boolean).join(" - ")
                  : null
              }
            />
            <SupplierInfoItem
              label="Última atualização"
              value={formatDateTime(resolvedSupplier.updatedAt)}
            />
            <div className="sm:col-span-2 xl:col-span-4 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Observações
              </p>
              <p className="mt-1 text-sm text-foreground">
                {resolvedSupplier.notes || "Nenhuma observação cadastrada."}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Usuários internos cadastrados
              </h3>
              <p className="text-sm text-muted-foreground">
                Pessoas do cliente com acesso ou participação operacional no portal.
              </p>
            </div>

            {internalUsers.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Nenhum usuario interno cadastrado para este supplier.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {internalUsers.length} usuario(s) interno(s) encontrados.
                </p>
                <SupplierInternalUsersTable items={internalUsers} />
              </div>
            )}
          </div>
        </section>
      ) : null}

      <SupplierDevelopmentBuyersSheet
        development={selectedDevelopment}
        buyers={selectedDevelopmentBuyers}
        open={Boolean(selectedDevelopment)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDevelopment(null);
          }
        }}
        processes={selectedDevelopmentProcesses}
      />
    </motion.section>
  );
}
