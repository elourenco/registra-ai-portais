import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TrashIcon,
} from "@registra/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  useDeleteDevelopmentMutation,
  useDevelopmentsQuery,
} from "@/features/developments/hooks/use-development-queries";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { routes } from "@/shared/constants/routes";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

export function DevelopmentsPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const developmentsQuery = useDevelopmentsQuery(debouncedSearch);
  const items = developmentsQuery.data?.items ?? [];

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Empreendimentos</h2>
          <p className="text-sm text-muted-foreground">
            Lista do supplier. O clique na linha abre o detalhe completo do empreendimento.
          </p>
        </div>
        <Button type="button" onClick={() => navigate(routes.developmentCreate)}>
          Cadastrar empreendimento
        </Button>
      </header>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Carteira de empreendimentos</CardTitle>
          <CardDescription>Empreendimentos vinculados ao supplier autenticado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.currentTarget.value)}
            placeholder="Buscar por nome, endereço ou CNPJ"
            aria-label="Buscar empreendimento"
          />

          {developmentsQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-14 rounded-md" />
              <Skeleton className="h-14 rounded-md" />
              <Skeleton className="h-14 rounded-md" />
            </div>
          ) : null}

          {developmentsQuery.isError ? (
            <div className="space-y-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>{getApiErrorMessage(developmentsQuery.error, "Não foi possível carregar os empreendimentos.")}</p>
              <Button type="button" variant="secondary" size="sm" onClick={() => developmentsQuery.refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : null}

          {!developmentsQuery.isPending && !developmentsQuery.isError && items.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              <p>Nenhum empreendimento encontrado.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(routes.developmentCreate)}>
                Cadastrar empreendimento
              </Button>
            </div>
          ) : null}

          {!developmentsQuery.isPending && !developmentsQuery.isError && items.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empreendimento</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Compradores</TableHead>
                    <TableHead className="w-[80px] text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.id}
                      role="link"
                      tabIndex={0}
                      className="cursor-pointer transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => navigate(routes.developmentDetailById(item.id))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(routes.developmentDetailById(item.id));
                        }
                      }}
                    >
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.cnpj}</TableCell>
                      <TableCell>{item.address}</TableCell>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>{item.buyersCount}</TableCell>
                      <TableCell className="text-center">
                        <DeleteDevelopmentAction development={{ id: item.id, name: item.name }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

function DeleteDevelopmentAction({ development }: { development: { id: string; name: string } }) {
  const queryClient = useQueryClient();
  const deleteDevelopmentMutation = useDeleteDevelopmentMutation(development.id);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-rose-100/50 hover:text-rose-600 focus-visible:ring-rose-500"
          onClick={(e) => e.stopPropagation()}
        >
          <TrashIcon className="h-4 w-4" />
          <span className="sr-only">Excluir empreendimento</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir empreendimento?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o empreendimento <strong>{development.name}</strong>?
            Esta ação não poderá ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500"
            onClick={(e) => {
              e.stopPropagation();
              deleteDevelopmentMutation.mutate(undefined, {
                onSuccess: () => {
                  queryClient.invalidateQueries({
                    queryKey: ["supplier", "developments"],
                  });
                },
                onError: (error) => {
                  console.error("Falha ao excluir empreendimento", error);
                },
              });
            }}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
