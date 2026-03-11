import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartResponsiveContainer,
  Skeleton,
  buttonVariants,
} from "@registra/ui";
import type { ProcessStatus } from "@registra/shared";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Building2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileWarning,
  ListTodo,
  PlusCircle,
  ShieldCheck,
  TimerReset,
  UserCircle2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardContractsDrawer } from "@/features/registration-core/components/dashboard-contracts-drawer";
import { PageHeader, RefreshAction } from "@/features/registration-core/components/page-header";
import { StatsCard } from "@/features/registration-core/components/stats-card";
import { StatusBadge } from "@/features/registration-core/components/status-badge";
import {
  blockTitleLabels,
  billingStatusLabels,
  formatCurrency,
  formatDate,
  processStatusLabels,
  requestStatusLabels,
  requestTypeLabels,
} from "@/features/registration-core/core/registration-presenters";
import { useDashboardQuery } from "@/features/dashboard/hooks/use-dashboard-query";
import { useRegistrationWorkspaceQuery } from "@/features/registration-core/hooks/use-registration-workspace-query";
import { routes } from "@/shared/constants/routes";

const completedBlockStatuses = new Set(["approved", "registered"]);
const statusChartPalette = ["#111827", "#2563eb", "#f59e0b", "#dc2626", "#16a34a", "#6b7280"];
const dashboardStatusOrder: ProcessStatus[] = [
  "active",
  "waiting_supplier",
  "waiting_registry_office",
  "requirement_open",
  "overdue",
  "completed",
];

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function getDaysOverdue(value: string): number {
  const diff = Date.now() - new Date(value).getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

type BigNumberMetricKey =
  | "activeSuppliers"
  | "monitoredBuyers"
  | "waitingSupplier"
  | "overdueProcesses"
  | "waitingRegistryOffice"
  | "pendingTasks"
  | "documentsForReview"
  | "capturedRevenue";

export function DashboardPage() {
  const dashboardQuery = useDashboardQuery();
  const workspaceQuery = useRegistrationWorkspaceQuery();
  const [selectedMetric, setSelectedMetric] = useState<BigNumberMetricKey | null>(null);

  const derivedData = useMemo(() => {
    if (!workspaceQuery.data) {
      return null;
    }

    const { buyers, developments, documents, processes, requests, suppliers, tasks } = workspaceQuery.data;
    const buyerMap = new Map(buyers.map((item) => [item.id, item]));
    const developmentMap = new Map(developments.map((item) => [item.id, item]));
    const supplierMap = new Map(suppliers.map((item) => [item.id, item]));

    const activeCheckpointMap = {
      certificate: 0,
      contract: 0,
      registration: 0,
    };

    for (const process of processes) {
      const currentBlock =
        process.blocks.find((block) => !completedBlockStatuses.has(block.status)) ??
        process.blocks[process.blocks.length - 1];

      activeCheckpointMap[currentBlock.key] += 1;
    }

    const blockDistribution = Object.entries(activeCheckpointMap).map(([key, value]) => ({
      label: blockTitleLabels[key as keyof typeof activeCheckpointMap],
      value,
    }));

    const processStatusDistribution = dashboardStatusOrder.map((status) => ({
      label: processStatusLabels[status],
      value: processes.filter((item) => item.status === status).length,
    }));

    const pendingBillingProcesses = processes.filter((item) => item.billing.status === "pending");
    const paidBillingProcesses = processes.filter((item) => item.billing.status === "paid");
    const overdueRequests = requests.filter(
      (item) =>
        ["created", "sent", "in_review", "resubmission_requested"].includes(item.status) &&
        new Date(item.deadline).getTime() < Date.now(),
    );
    const supplierGateProcesses = processes.filter((item) =>
      item.blocks.some((block) => block.supplierActionRequired),
    );
    const rejectedDocuments = documents.filter((item) => item.status === "rejected");
    const inProgressTasks = tasks.filter((item) => item.status === "in_progress");

    const processContracts = processes.map((process) => ({
      process,
      supplier: supplierMap.get(process.supplierId),
      development: developmentMap.get(process.developmentId),
      buyer: buyerMap.get(process.buyerId),
    }));

    return {
      totalSuppliers: suppliers.length,
      totalDevelopments: developments.length,
      totalBuyers: buyers.length,
      totalProcesses: processes.length,
      pendingBillingProcesses,
      paidBillingAmount: paidBillingProcesses.reduce((total, item) => total + item.billing.unitValue, 0),
      overdueRequests,
      supplierGateProcesses,
      rejectedDocuments,
      inProgressTasks,
      blockDistribution,
      processStatusDistribution,
      buyerMap,
      developmentMap,
      supplierMap,
      processContracts,
    };
  }, [workspaceQuery.data]);

  const drawerConfig = useMemo(() => {
    if (!derivedData || !selectedMetric) {
      return null;
    }

    const processContracts = derivedData.processContracts;
    type DrawerProcessContract = (typeof processContracts)[number];

    const makeItems = (
      filter: (item: DrawerProcessContract) => boolean,
      reason: (item: DrawerProcessContract) => string,
    ) =>
      processContracts
        .filter(
          (item) =>
            Boolean(item.supplier) &&
            Boolean(item.development) &&
            Boolean(item.buyer) &&
            filter(item),
        )
        .map((item) => ({
          process: item.process,
          supplierName: item.supplier?.name ?? "-",
          developmentName: item.development?.name ?? "-",
          buyerName: item.buyer?.name ?? "-",
          reason: reason(item),
        }));

    const configs: Record<
      BigNumberMetricKey,
      { title: string; description: string; navigationLabel: string; navigationTo: string; items: ReturnType<typeof makeItems> }
    > = {
      activeSuppliers: {
        title: "Clientes ativos",
        description: "Contratos vinculados a clientes ativos e operando normalmente na plataforma.",
        navigationLabel: "clientes",
        navigationTo: routes.suppliers,
        items: makeItems(
          (item) => item.supplier?.status === "active",
          (item) => `Cliente ativo: ${item.supplier?.name ?? "-"}`,
        ),
      },
      monitoredBuyers: {
        title: "Compradores monitorados",
        description: "Contratos acompanhados pelo backoffice com comprador já vinculado ao processo.",
        navigationLabel: "compradores",
        navigationTo: routes.buyers,
        items: makeItems(
          () => true,
          (item) => `Comprador monitorado: ${item.buyer?.name ?? "-"}`,
        ),
      },
      waitingSupplier: {
        title: "Processos aguardando resposta externa",
        description: "Contratos bloqueados por resposta de supplier ou comprador em algum checkpoint obrigatório.",
        navigationLabel: "solicitações",
        navigationTo: routes.requests,
        items: makeItems(
          (item) => item.process.status === "waiting_supplier",
          (item) => `Aguardando retorno externo no fluxo ${item.process.currentStep}`,
        ),
      },
      overdueProcesses: {
        title: "Processos atrasados",
        description: "Contratos com prazo operacional estourado e ação imediata recomendada.",
        navigationLabel: "processos",
        navigationTo: routes.processes,
        items: makeItems(
          (item) => item.process.status === "overdue",
          (item) => `${getDaysOverdue(item.process.dueAt)} dias fora do prazo`,
        ),
      },
      waitingRegistryOffice: {
        title: "Aguardando cartório",
        description: "Contratos enviados ao cartório e sem retorno conclusivo.",
        navigationLabel: "processos",
        navigationTo: routes.processes,
        items: makeItems(
          (item) => item.process.status === "waiting_registry_office",
          (item) => `Em espera de cartório desde ${formatDate(item.process.dueAt)}`,
        ),
      },
      pendingTasks: {
        title: "Tarefas em aberto",
        description: "Contratos com backlog operacional pendente ou em andamento para o time interno.",
        navigationLabel: "tarefas",
        navigationTo: routes.tasks,
        items: makeItems(
          (item) =>
            workspaceQuery.data?.tasks.some(
              (task) =>
                task.processId === item.process.id &&
                task.status !== "completed" &&
                task.status !== "cancelled",
            ) ?? false,
          (item) => {
            const task = workspaceQuery.data?.tasks.find(
              (currentTask) =>
                currentTask.processId === item.process.id &&
                currentTask.status !== "completed" &&
                currentTask.status !== "cancelled",
            );

            return task ? `Tarefa pendente: ${task.title}` : "Backlog operacional em aberto";
          },
        ),
      },
      documentsForReview: {
        title: "Documentos para validar",
        description: "Contratos com documento enviado e aguardando parecer do backoffice.",
        navigationLabel: "documentos",
        navigationTo: routes.documents,
        items: makeItems(
          (item) =>
            workspaceQuery.data?.documents.some(
              (document) => document.processId === item.process.id && document.status === "in_review",
            ) ?? false,
          (item) => {
            const document = workspaceQuery.data?.documents.find(
              (currentDocument) =>
                currentDocument.processId === item.process.id && currentDocument.status === "in_review",
            );

            return document ? `Documento em análise: ${document.name}` : "Documento aguardando validação";
          },
        ),
      },
      capturedRevenue: {
        title: "Receita capturada",
        description: "Contratos cuja cobrança única já foi paga e entrou em receita realizada.",
        navigationLabel: "processos",
        navigationTo: routes.processes,
        items: makeItems(
          (item) => item.process.billing.status === "paid",
          (item) => `Cobrança paga: ${formatCurrency(item.process.billing.unitValue)}`,
        ),
      },
    };

    return configs[selectedMetric];
  }, [derivedData, selectedMetric, workspaceQuery.data]);

  const isLoading = dashboardQuery.isPending || workspaceQuery.isPending;
  const hasError = dashboardQuery.isError || workspaceQuery.isError;

  return (
    <section className="space-y-6">
      <PageHeader
        title="Visão geral"
        description="Dashboard administrativo do backoffice para acompanhar volume, gargalos, checkpoints obrigatórios e saúde financeira do processo de registro."
        actions={
          <>
            <RefreshAction
              onClick={() => {
                dashboardQuery.refetch();
                workspaceQuery.refetch();
              }}
              disabled={dashboardQuery.isFetching || workspaceQuery.isFetching}
            />
            <Link to={routes.processes} className={buttonVariants({ size: "sm" })}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo processo
            </Link>
          </>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={String(index)} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : null}

      {hasError ? (
        <Card className="border-rose-200 bg-rose-50/70">
          <CardContent className="flex items-center justify-between gap-3 p-6">
            <div>
              <p className="font-medium text-rose-700">Não foi possível carregar o dashboard operacional.</p>
              <p className="text-sm text-rose-700/80">Revise a fonte mock ou tente novamente.</p>
            </div>
            <Button
              type="button"
              onClick={() => {
                dashboardQuery.refetch();
                workspaceQuery.refetch();
              }}
            >
              Recarregar
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {dashboardQuery.data && derivedData ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              title="Clientes ativos"
              value={derivedData.totalSuppliers}
              description="Clientes B2B habilitados na plataforma."
              icon={Building2}
              footer={`${derivedData.totalDevelopments} empreendimentos ativos ou em lançamento`}
              onValueClick={() => setSelectedMetric("activeSuppliers")}
            />
            <StatsCard
              title="Compradores monitorados"
              value={derivedData.totalBuyers}
              description="Pessoas físicas com processo vinculado."
              icon={UserCircle2}
              footer={`${derivedData.totalProcesses} processos no admin`}
              onValueClick={() => setSelectedMetric("monitoredBuyers")}
            />
            <StatsCard
              title="Processos aguardando resposta externa"
              value={dashboardQuery.data.waitingSupplier}
              description="Checkpoints bloqueados por resposta externa."
              icon={TimerReset}
              tone="warning"
              footer={`${derivedData.supplierGateProcesses.length} processos com ação obrigatória`}
              onValueClick={() => setSelectedMetric("waitingSupplier")}
            />
            <StatsCard
              title="Processos atrasados"
              value={dashboardQuery.data.overdueProcesses}
              description="Casos acima do prazo operacional."
              icon={FileWarning}
              tone="danger"
              footer={`${dashboardQuery.data.processesWithRequirement} com exigência aberta`}
              onValueClick={() => setSelectedMetric("overdueProcesses")}
            />
            <StatsCard
              title="Aguardando cartório"
              value={dashboardQuery.data.waitingRegistryOffice}
              description="Documentos enviados e sem retorno."
              icon={Clock3}
              tone="neutral"
              footer="Foco em follow-up e previsibilidade"
              onValueClick={() => setSelectedMetric("waitingRegistryOffice")}
            />
            <StatsCard
              title="Tarefas em aberto"
              value={dashboardQuery.data.pendingTasks}
              description="Backlog total do time operacional."
              icon={ListTodo}
              tone="warning"
              footer={`${derivedData.inProgressTasks.length} já em andamento`}
              onValueClick={() => setSelectedMetric("pendingTasks")}
            />
            <StatsCard
              title="Documentos para validar"
              value={dashboardQuery.data.documentsWaitingValidation}
              description="Arquivos aguardando parecer do backoffice."
              icon={FileCheck2}
              tone="warning"
              footer={`${derivedData.rejectedDocuments.length} reprovados para reenvio`}
              onValueClick={() => setSelectedMetric("documentsForReview")}
            />
            <StatsCard
              title="Receita capturada"
              value={formatCompactNumber(derivedData.paidBillingAmount)}
              description="Soma das cobranças únicas pagas."
              icon={CircleDollarSign}
              tone="success"
              footer={`${derivedData.pendingBillingProcesses.length} cobranças pendentes`}
              onValueClick={() => setSelectedMetric("capturedRevenue")}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <Card className="border-rose-200 bg-rose-50/70 xl:col-span-1">
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-rose-700">Processos críticos</p>
                  <AlertTriangle className="h-4 w-4 text-rose-700" />
                </div>
                <p className="text-4xl font-semibold text-rose-700">{dashboardQuery.data.criticalProcesses.length}</p>
                <p className="text-xs text-rose-700/80">Processos com atraso ou exigência cartorária aberta.</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50/70 xl:col-span-1">
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-amber-700">Solicitações vencidas</p>
                  <BellRing className="h-4 w-4 text-amber-700" />
                </div>
                <p className="text-4xl font-semibold text-amber-700">{derivedData.overdueRequests.length}</p>
                <p className="text-xs text-amber-700/80">Demandas sem resposta de supplier ou comprador fora do SLA esperado.</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50/70 xl:col-span-1">
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-amber-700">Cobranças pendentes</p>
                  <CircleDollarSign className="h-4 w-4 text-amber-700" />
                </div>
                <p className="text-4xl font-semibold text-amber-700">{derivedData.pendingBillingProcesses.length}</p>
                <p className="text-xs text-amber-700/80">
                  {formatCurrency(
                    derivedData.pendingBillingProcesses.reduce((total, item) => total + item.billing.unitValue, 0),
                  )}{" "}
                  aguardando pagamento.
                </p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50/70 xl:col-span-1">
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-emerald-700">Fluxo auditável</p>
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                </div>
                <p className="text-4xl font-semibold text-emerald-700">{dashboardQuery.data.recentlyCreatedProcesses.length}</p>
                <p className="text-xs text-emerald-700/80">Processos novos já entram com histórico, solicitação e cobrança rastreável.</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.3fr,1fr]">
            <Card className="border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Distribuição por checkpoint</CardTitle>
                <CardDescription>Mostra em qual bloco cada processo está travado ou sendo operado no momento.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ChartResponsiveContainer>
                  <BarChart data={derivedData.blockDistribution}>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#111827" />
                  </BarChart>
                </ChartResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Status macro da operação</CardTitle>
                <CardDescription>Panorama do funil de processos em linguagem de negócio do backoffice.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ChartResponsiveContainer>
                  <BarChart data={derivedData.processStatusDistribution} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="4 4" />
                    <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={130} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                      {derivedData.processStatusDistribution.map((item, index) => (
                        <Cell key={item.label} fill={statusChartPalette[index % statusChartPalette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr,1.1fr]">
            <Card className="border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Top processos críticos</CardTitle>
                <CardDescription>Casos que merecem foco imediato da operação.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardQuery.data.criticalProcesses.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.propertyLabel}</p>
                        <p className="text-sm text-muted-foreground">{item.currentStep}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.registryOffice}</p>
                      </div>
                      <StatusBadge status={item.status} label={processStatusLabels[item.status]} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{getDaysOverdue(item.dueAt)} dias fora do prazo</span>
                      <Link className="font-medium text-primary" to={routes.processDetailById(item.id)}>
                        Abrir processo
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Solicitações pendentes da jornada</CardTitle>
                <CardDescription>Pedidos que seguram o avanço dos blocos do workflow.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardQuery.data.pendingRequests.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border/70 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} label={requestStatusLabels[item.status]} />
                      <span className="text-xs text-muted-foreground">{blockTitleLabels[item.block]}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium">{requestTypeLabels[item.type]}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Prazo {formatDate(item.deadline)}</span>
                      <Link className="font-medium text-primary" to={routes.processDetailById(item.processId)}>
                        Abrir processo
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            <Card className="border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Processos criados recentemente</CardTitle>
                <CardDescription>Entrada de novos processos com visão rápida de proprietário e prazo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardQuery.data.recentlyCreatedProcesses.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/70 p-4">
                    <div>
                      <p className="font-medium">{item.propertyLabel}</p>
                      <p className="text-sm text-muted-foreground">{item.internalOwner} · criado em {formatDate(item.createdAt)}</p>
                    </div>
                    <Link to={routes.processDetailById(item.id)} className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Ver detalhe
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {drawerConfig ? (
        <DashboardContractsDrawer
          open={Boolean(selectedMetric)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedMetric(null);
            }
          }}
          title={drawerConfig.title}
          description={drawerConfig.description}
          navigationLabel={drawerConfig.navigationLabel}
          navigationTo={drawerConfig.navigationTo}
          items={drawerConfig.items}
        />
      ) : null}
    </section>
  );
}
