import type {
  BackofficeUser,
  BackofficeUserListStatusFilter,
  CreateBackofficeUserInput,
  UpdateBackofficeUserInput,
} from "@registra/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/app/providers/auth-provider";
import {
  createBackofficeUser,
  deleteBackofficeUser,
  updateBackofficeUser,
} from "@/features/backoffice-users/api/backoffice-users-api";
import {
  CreateBackofficeUserDialog,
  EditBackofficeUserDialog,
} from "@/features/backoffice-users/components/backoffice-user-form-dialog";
import { BackofficeUsersTable } from "@/features/backoffice-users/components/backoffice-users-table";
import { useBackofficeUserListFilters } from "@/features/backoffice-users/hooks/use-backoffice-user-list-filters";
import {
  backofficeUsersQueryKey,
  useBackofficeUsersQuery,
} from "@/features/backoffice-users/hooks/use-backoffice-users-query";
import { backofficeUserStatusOptions } from "@/features/backoffice-users/utils/backoffice-user-status-options";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { isUnauthorizedError } from "@/shared/api/query-retry";
import { useUnauthorizedSessionRedirect } from "@/shared/hooks/use-unauthorized-session-redirect";
import { getPaginationSummary } from "@/shared/utils/pagination";

function getMutationErrorMessage(error: unknown, fallbackMessage: string): string | null {
  if (!error) {
    return null;
  }

  return getApiErrorMessage(error, fallbackMessage);
}

export function BackofficeUsersPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const {
    filters,
    page,
    resetFilters,
    searchInput,
    setPage,
    setSearchInput,
    setStatusFilter,
    statusFilter,
  } = useBackofficeUserListFilters();
  const usersQuery = useBackofficeUsersQuery(filters);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<BackofficeUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<BackofficeUser | null>(null);

  const createMutation = useMutation({
    mutationFn: createBackofficeUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: backofficeUsersQueryKey });
      setIsCreateDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateBackofficeUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: backofficeUsersQueryKey });
      setEditingUser(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBackofficeUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: backofficeUsersQueryKey });
      setUserToDelete(null);
    },
  });

  const items = usersQuery.data?.items ?? [];
  const pagination = usersQuery.data?.pagination;
  const visibleItems = useMemo(() => {
    const normalizedSearch = searchInput.trim().toLowerCase();

    return items.filter((user) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, searchInput, statusFilter]);

  useEffect(() => {
    if (pagination && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination, setPage]);

  const hasUnauthorizedMutationError = [createMutation.error, updateMutation.error, deleteMutation.error].some(
    (error) => isUnauthorizedError(error),
  );

  useUnauthorizedSessionRedirect(
    (usersQuery.isError && isUnauthorizedError(usersQuery.error)) || hasUnauthorizedMutationError,
  );

  const { endItem, startItem, totalItems } = getPaginationSummary(pagination, items.length);

  const handleCreateUser = (values: CreateBackofficeUserInput) => {
    if (!session?.token) {
      return;
    }

    createMutation.mutate({
      token: session.token,
      input: values,
    });
  };

  const handleUpdateUser = (values: UpdateBackofficeUserInput) => {
    if (!session?.token || !editingUser) {
      return;
    }

    updateMutation.mutate({
      token: session.token,
      userId: editingUser.id,
      input: values,
    });
  };

  const handleDeleteUser = () => {
    if (!session?.token || !userToDelete) {
      return;
    }

    deleteMutation.mutate({
      token: session.token,
      userId: userToDelete.id,
    });
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        <header className="space-y-1">
          <h2 className="text-2xl font-semibold">Usuários do backoffice</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie quem pode acessar o portal administrativo da operação.
          </p>
        </header>

        <Card className="border-slate-200/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">Acessos do portal</CardTitle>
                <CardDescription>
                  {searchInput.trim() || statusFilter !== "all"
                    ? `${visibleItems.length} usuário(s) na página atual. ${totalItems} no total.`
                    : `${totalItems} usuário(s) encontrado(s).`}
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => usersQuery.refetch()}
                  disabled={usersQuery.isFetching}
                >
                  Atualizar
                </Button>
                <Button type="button" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                  Novo usuário
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.currentTarget.value)}
                placeholder="Buscar por nome ou e-mail"
                aria-label="Buscar usuário"
              />

              <Select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as BackofficeUserListStatusFilter)
                }
                aria-label="Filtrar por status"
              >
                {backofficeUserStatusOptions.map((option) => (
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
            {usersQuery.isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            ) : null}

            {usersQuery.isError ? (
              <div className="space-y-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p>
                  {getApiErrorMessage(
                    usersQuery.error,
                    "Não foi possível carregar a lista de usuários do backoffice.",
                  )}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => usersQuery.refetch()}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : null}

            {!usersQuery.isPending && !usersQuery.isError && visibleItems.length === 0 ? (
              <div className="space-y-3 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                <p>Nenhum usuário encontrado para os filtros aplicados.</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                    Limpar filtros
                  </Button>
                  <Button type="button" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                    Criar primeiro usuário
                  </Button>
                </div>
              </div>
            ) : null}

            {!usersQuery.isPending && !usersQuery.isError && visibleItems.length > 0 ? (
              <div className="space-y-3">
                <BackofficeUsersTable
                  items={visibleItems}
                  onEditUser={setEditingUser}
                  onDeleteUser={setUserToDelete}
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
                      disabled={!pagination?.hasPreviousPage || usersQuery.isFetching}
                    >
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((currentPage) => currentPage + 1)}
                      disabled={!pagination?.hasNextPage || usersQuery.isFetching}
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

      <CreateBackofficeUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateUser}
        isPending={createMutation.isPending}
        errorMessage={getMutationErrorMessage(
          createMutation.error,
          "Não foi possível criar o usuário do backoffice.",
        )}
      />

      <EditBackofficeUserDialog
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
          }
        }}
        onSubmit={handleUpdateUser}
        isPending={updateMutation.isPending}
        errorMessage={getMutationErrorMessage(
          updateMutation.error,
          "Não foi possível atualizar o usuário do backoffice.",
        )}
        user={editingUser}
      />

      <AlertDialog
        open={Boolean(userToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setUserToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete
                ? `O acesso de ${userToDelete.name} ao portal backoffice será removido.`
                : "O acesso ao portal backoffice será removido."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir usuário"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
