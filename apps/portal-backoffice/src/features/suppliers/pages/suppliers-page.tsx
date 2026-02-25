import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select } from "@registra/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import { listSuppliers } from "@/features/suppliers/api/suppliers-api";
import {
  listWorkflows,
  upsertSupplierWorkflowAssignment,
} from "@/features/workflows/api/workflows-api";
import { ApiClientError, getApiErrorMessage } from "@/shared/api/http-client";
import { routes } from "@/shared/constants/routes";

const PAGE_SIZE = 10;

function getStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Ativo";
    case "pending_onboarding":
      return "Onboarding";
    case "suspended":
      return "Suspenso";
    case "draft":
      return "Rascunho";
    default:
      return status;
  }
}

function getStatusClasses(status: string): string {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending_onboarding":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "draft":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "suspended":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function SuppliersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, logout } = useAuth();
  const [page, setPage] = useState(1);
  const [updatingSupplierId, setUpdatingSupplierId] = useState<string | null>(null);

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", session?.user.id, page, PAGE_SIZE],
    queryFn: async () => {
      if (!session?.token) {
        throw new Error("Sessão inválida para buscar fornecedores.");
      }

      return listSuppliers({
        token: session.token,
        page,
        limit: PAGE_SIZE,
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

  const workflowsQuery = useQuery({
    queryKey: ["workflows", "catalog", session?.user.id],
    queryFn: async () => {
      if (!session?.token) {
        throw new Error("Sessão inválida para listar workflows.");
      }

      return listWorkflows({ token: session.token });
    },
    enabled: Boolean(session?.token),
  });

  const assignWorkflowMutation = useMutation({
    mutationFn: upsertSupplierWorkflowAssignment,
    onMutate: ({ supplierCompanyId }) => {
      setUpdatingSupplierId(supplierCompanyId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
        queryClient.invalidateQueries({ queryKey: ["workflows", "catalog"] }),
      ]);
    },
    onSettled: () => {
      setUpdatingSupplierId(null);
    },
  });

  const items = suppliersQuery.data?.items ?? [];
  const pagination = suppliersQuery.data?.pagination;

  useEffect(() => {
    if (pagination && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination]);

  useEffect(() => {
    if (
      suppliersQuery.isError &&
      suppliersQuery.error instanceof ApiClientError &&
      suppliersQuery.error.status === 401
    ) {
      logout();
      navigate(routes.login, { replace: true });
    }
  }, [logout, navigate, suppliersQuery.error, suppliersQuery.isError]);

  const startItem =
    pagination && pagination.totalItems > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endItem =
    pagination && pagination.totalItems > 0
      ? Math.min(pagination.page * pagination.limit, pagination.totalItems)
      : 0;

  const defaultWorkflow = workflowsQuery.data?.find((workflow) => workflow.isDefault);

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
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg">Base de suppliers</CardTitle>
            <CardDescription>
              {pagination?.totalItems ?? items.length} registros encontrados.
            </CardDescription>
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
        </CardHeader>

        <CardContent className="pt-0">
          {suppliersQuery.isPending && (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Carregando suppliers...
            </p>
          )}

          {suppliersQuery.isError && (
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
          )}

          {!suppliersQuery.isPending &&
            !suppliersQuery.isError &&
            items.length === 0 && (
              <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Nenhum supplier encontrado.
              </p>
            )}

          {!suppliersQuery.isPending &&
            !suppliersQuery.isError &&
            items.length > 0 && (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-lg border">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Empresa</th>
                        <th className="px-4 py-3 font-medium">CNPJ</th>
                        <th className="px-4 py-3 font-medium">E-mail</th>
                        <th className="px-4 py-3 font-medium">Workflow</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Criado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((supplier) => {
                        const selectedWorkflowId = supplier.workflowId ?? defaultWorkflow?.id ?? "";
                        const inheritedFromDefault = !supplier.workflowId && Boolean(defaultWorkflow?.id);

                        return (
                          <tr key={supplier.id} className="border-t align-top">
                            <td className="px-4 py-3 font-medium">{supplier.legalName}</td>
                            <td className="px-4 py-3 text-muted-foreground">{supplier.cnpj}</td>
                            <td className="px-4 py-3 text-muted-foreground">{supplier.email}</td>
                            <td className="min-w-[280px] px-4 py-3">
                              <div className="space-y-1.5">
                                <Select
                                  value={selectedWorkflowId}
                                  onChange={(event) => {
                                    if (!session?.token) {
                                      return;
                                    }

                                    assignWorkflowMutation.mutate({
                                      token: session.token,
                                      supplierCompanyId: supplier.id,
                                      workflowId: event.target.value,
                                    });
                                  }}
                                  disabled={
                                    workflowsQuery.isPending ||
                                    workflowsQuery.isError ||
                                    assignWorkflowMutation.isPending ||
                                    !session?.token
                                  }
                                >
                                  {(workflowsQuery.data ?? []).map((workflow) => (
                                    <option key={workflow.id} value={workflow.id}>
                                      {workflow.name}
                                    </option>
                                  ))}
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  {inheritedFromDefault
                                    ? "Herdado do workflow default"
                                    : "Vínculo customizado para este supplier"}
                                </p>
                                {updatingSupplierId === supplier.id ? (
                                  <p className="text-xs text-primary">Salvando alteração...</p>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(supplier.status)}`}
                              >
                                {getStatusLabel(supplier.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {formatDateTime(supplier.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {assignWorkflowMutation.isError ? (
                  <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    Não foi possível salvar o workflow do supplier. Tente novamente.
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Mostrando {startItem} - {endItem} de {pagination?.totalItems ?? items.length}
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
            )}
        </CardContent>
      </Card>
    </motion.section>
  );
}
