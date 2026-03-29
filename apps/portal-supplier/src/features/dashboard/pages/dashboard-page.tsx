import {
  Badge,
  Button,
  Building2Icon,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CircleCheckBigIcon,
  CircleHelpIcon,
  Clock3Icon,
  Separator,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@registra/ui";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  developmentStatusLabels,
  type DevelopmentListItem,
} from "@/features/developments/core/developments-schema";
import { useDevelopmentsQuery } from "@/features/developments/hooks/use-development-queries";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { routes } from "@/shared/constants/routes";

const statusToneClassName: Record<DevelopmentListItem["status"], string> = {
  drafting: "bg-slate-100 text-slate-700 border-slate-200",
  commercialization: "bg-sky-50 text-sky-700 border-sky-200",
  registry: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
};

function formatPortfolioCoverage(total: number, active: number) {
  if (total === 0) {
    return "Sem carteira ativa";
  }

  return `${Math.round((active / total) * 100)}% da carteira em operação`;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const developmentsQuery = useDevelopmentsQuery();
  const items = developmentsQuery.data?.items ?? [];

  const metrics = useMemo(() => {
    const drafting = items.filter((item) => item.status === "drafting").length;
    const commercialization = items.filter((item) => item.status === "commercialization").length;
    const registry = items.filter((item) => item.status === "registry").length;
    const completed = items.filter((item) => item.status === "completed").length;
    const buyers = items.reduce((total, item) => total + item.buyersCount, 0);

    return {
      total: items.length,
      drafting,
      commercialization,
      registry,
      completed,
      buyers,
    };
  }, [items]);

  const spotlightItems = useMemo(
    () =>
      [...items]
        .sort((left, right) => right.buyersCount - left.buyersCount)
        .slice(0, 5),
    [items],
  );

  return (
    <section className="space-y-6">
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-xs font-medium">
              Supplier workspace
            </Badge>
            <div className="space-y-1">
              <CardTitle className="text-3xl tracking-tight">Visão executiva da carteira</CardTitle>
              <CardDescription className="max-w-2xl text-sm">
                Acompanhe saúde operacional, ritmo de expansão e concentração de compradores em um painel único.
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => developmentsQuery.refetch()}>
              Atualizar dados
            </Button>
            <Button onClick={() => navigate(routes.developmentCreate)}>
              Novo empreendimento
            </Button>
          </div>
        </CardHeader>
      </Card>

      {developmentsQuery.isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {developmentsQuery.isError ? (
        <Card className="border-rose-200 bg-rose-50/80 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-5">
            <p className="text-sm font-medium text-rose-700">
              {getApiErrorMessage(
                developmentsQuery.error,
                "Não foi possível carregar a visão executiva do supplier.",
              )}
            </p>
            <div>
              <Button variant="secondary" size="sm" onClick={() => developmentsQuery.refetch()}>
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!developmentsQuery.isPending && !developmentsQuery.isError ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="pb-3">
                <CardDescription>Total da carteira</CardDescription>
                <CardTitle className="text-4xl">{metrics.total}</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-sm text-muted-foreground">
                  {formatPortfolioCoverage(metrics.total, metrics.commercialization + metrics.registry)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="pb-3">
                <CardDescription>Compradores monitorados</CardDescription>
                <CardTitle className="text-4xl">{metrics.buyers}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Soma dos compradores vinculados aos empreendimentos da carteira.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardDescription>Em estruturação</CardDescription>
                <CardTitle className="text-4xl">{metrics.drafting}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-emerald-700/80">
                  {metrics.commercialization} em comercialização e {metrics.completed} concluídos.
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardDescription>Em registro</CardDescription>
                <CardTitle className="text-4xl">{metrics.registry}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700/80">
                  Empreendimentos já na fase registral da operação.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader>
                <CardTitle>Carteira priorizada</CardTitle>
                <CardDescription>
                  Empreendimentos com maior concentração de compradores na operação.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {spotlightItems.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">
                    Nenhum empreendimento cadastrado até o momento.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empreendimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Compradores</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {spotlightItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.address}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={statusToneClassName[item.status]}
                            >
                              {developmentStatusLabels[item.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.buyersCount}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(routes.developmentDetailById(item.id))}
                            >
                              Abrir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader>
                <CardTitle>Leituras rápidas</CardTitle>
                <CardDescription>
                  Sinais para priorização comercial e operacional do supplier.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-4">
                  <Building2Icon className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Expansão da carteira</p>
                    <p className="text-sm text-muted-foreground">
                      {metrics.commercialization > 0
                        ? `${metrics.commercialization} empreendimento(s) em fase de comercialização.`
                        : "Não há lançamentos pendentes na carteira atual."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-4">
                  <CircleHelpIcon className="mt-0.5 h-4 w-4 text-amber-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Atenção operacional</p>
                    <p className="text-sm text-muted-foreground">
                      {metrics.registry > 0
                        ? `${metrics.registry} empreendimento(s) estão em registro e exigem acompanhamento operacional.`
                        : "Não há gargalos registrários visíveis no momento."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-4">
                  <Clock3Icon className="mt-0.5 h-4 w-4 text-sky-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Concentração de operação</p>
                    <p className="text-sm text-muted-foreground">
                      {spotlightItems[0]
                        ? `${spotlightItems[0].name} lidera a carteira com ${spotlightItems[0].buyersCount} comprador(es).`
                        : "Sem volume suficiente para destacar um empreendimento líder."}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <CircleCheckBigIcon className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Base concluída</p>
                    <p className="text-sm text-emerald-800/80">
                      {metrics.completed > 0
                        ? `${metrics.completed} empreendimento(s) já concluíram o ciclo atual.`
                        : "Ainda não há empreendimentos concluídos nesta carteira."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </section>
  );
}
