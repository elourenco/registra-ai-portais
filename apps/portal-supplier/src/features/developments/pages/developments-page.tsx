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
  Building2Icon,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Badge,
  CircleHelpIcon,
  SearchIcon,
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
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  useDeleteDevelopmentMutation,
  useDevelopmentsQuery,
} from "@/features/developments/hooks/use-development-queries";
import {
  developmentStatusLabels,
  type DevelopmentListItem,
} from "@/features/developments/core/developments-schema";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { routes } from "@/shared/constants/routes";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

const statusToneClassName: Record<DevelopmentListItem["status"], string> = {
  drafting: "bg-slate-100 text-slate-700 border-slate-200",
  commercialization: "bg-sky-50 text-sky-700 border-sky-200",
  registry: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
};

export function DevelopmentsPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const developmentsQuery = useDevelopmentsQuery(debouncedSearch);
  const items = developmentsQuery.data?.items ?? [];
  const metrics = useMemo(
    () => ({
      total: items.length,
      active: items.filter((item) => item.status === "drafting").length,
      launching: items.filter((item) => item.status === "commercialization").length,
      pending: items.filter((item) => item.status === "registry").length,
      buyers: items.reduce((total, item) => total + item.buyersCount, 0),
    }),
    [items],
  );

  return (
    <section className="space-y-6">
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-xs font-medium">
              Portfolio management
            </Badge>
            <div className="space-y-1">
              <CardTitle className="text-3xl tracking-tight">Empreendimentos</CardTitle>
              <CardDescription>
                Carteira do supplier com visão direta de status, volumetria comercial e acesso rápido ao detalhe.
              </CardDescription>
            </div>
          </div>
          <Button type="button" onClick={() => navigate(routes.developmentCreate)}>
            Cadastrar empreendimento
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription>Total da carteira</CardDescription>
            <CardTitle className="text-4xl">{metrics.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Base total de empreendimentos do supplier.</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription>Em operação</CardDescription>
            <CardTitle className="text-4xl">{metrics.active}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-emerald-700/80">Empreendimentos ativos na carteira atual.</p>
          </CardContent>
        </Card>
        <Card className="border-sky-200 bg-sky-50/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription>Em lançamento</CardDescription>
            <CardTitle className="text-4xl">{metrics.launching}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-sky-700/80">Projetos em expansão comercial e cadastro.</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription>Compradores vinculados</CardDescription>
            <CardTitle className="text-4xl">{metrics.buyers}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700/80">
              {metrics.pending} empreendimento(s) com pendência documental.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Carteira de empreendimentos</CardTitle>
          <CardDescription>Empreendimentos vinculados ao supplier autenticado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.currentTarget.value)}
              placeholder="Buscar por nome, endereço ou CNPJ"
              aria-label="Buscar empreendimento"
              className="pl-9"
            />
          </div>

          {developmentsQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-14 rounded-md" />
              <Skeleton className="h-14 rounded-md" />
              <Skeleton className="h-14 rounded-md" />
            </div>
          ) : null}

          {developmentsQuery.isError ? (
            <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
              <div className="flex items-start gap-2">
                <CircleHelpIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{getApiErrorMessage(developmentsQuery.error, "Não foi possível carregar os empreendimentos.")}</p>
              </div>
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
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            <Building2Icon className="mr-1 inline h-3.5 w-3.5" />
                            {item.cnpj}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{item.cnpj}</TableCell>
                      <TableCell>{item.address}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusToneClassName[item.status]}>
                          {developmentStatusLabels[item.status]}
                        </Badge>
                      </TableCell>
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
