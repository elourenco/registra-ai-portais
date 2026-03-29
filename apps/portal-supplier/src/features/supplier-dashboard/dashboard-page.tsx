import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CircleCheckBigIcon,
  Clock3Icon,
  Skeleton,
} from "@registra/ui";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ActivityFeed } from "@/features/supplier-dashboard/components/activity-feed";
import { AlertsCard } from "@/features/supplier-dashboard/components/alerts-card";
import { BuyersTable } from "@/features/supplier-dashboard/components/buyers-table";
import { KpiCards } from "@/features/supplier-dashboard/components/kpi-cards";
import { PerformanceMetrics } from "@/features/supplier-dashboard/components/performance-metrics";
import { Pipeline } from "@/features/supplier-dashboard/components/pipeline";
import { routes } from "@/shared/constants/routes";

type BuyerStage = "Certificado" | "Contrato" | "Registro" | "Finalizado";
type BuyerStatus = "Em andamento" | "Aguardando comprador" | "Em análise" | "Atrasado" | "Concluído";

interface BuyerDashboardItem {
  id: string;
  buyerId: string;
  processId: string;
  developmentId: string;
  name: string;
  empreendimento: string;
  stage: BuyerStage;
  status: BuyerStatus;
  stuckDays: number;
  responsible: string;
  lastUpdate: string;
  completedInLast30Days: boolean;
}

interface ActivityItem {
  id: string;
  action: string;
  buyerName: string;
  timeLabel: string;
}

const buyers: BuyerDashboardItem[] = [
  {
    id: "dash-1",
    buyerId: "buyer-11",
    processId: "proc-11",
    developmentId: "dev-aurora",
    name: "Maria Fernanda Lima",
    empreendimento: "Residencial Aurora",
    stage: "Certificado",
    status: "Aguardando comprador",
    stuckDays: 5,
    responsible: "Julia Martins",
    lastUpdate: "há 2h",
    completedInLast30Days: false,
  },
  {
    id: "dash-2",
    buyerId: "buyer-12",
    processId: "proc-12",
    developmentId: "dev-aurora",
    name: "João Vitor Azevedo",
    empreendimento: "Residencial Aurora",
    stage: "Contrato",
    status: "Em andamento",
    stuckDays: 2,
    responsible: "Julia Martins",
    lastUpdate: "há 5h",
    completedInLast30Days: false,
  },
  {
    id: "dash-3",
    buyerId: "buyer-21",
    processId: "proc-21",
    developmentId: "dev-bosque",
    name: "Camila Rocha",
    empreendimento: "Bosque das Palmeiras",
    stage: "Registro",
    status: "Em análise",
    stuckDays: 3,
    responsible: "Renata Castro",
    lastUpdate: "há 1h",
    completedInLast30Days: false,
  },
  {
    id: "dash-4",
    buyerId: "buyer-22",
    processId: "proc-22",
    developmentId: "dev-bosque",
    name: "Felipe Nogueira",
    empreendimento: "Bosque das Palmeiras",
    stage: "Registro",
    status: "Atrasado",
    stuckDays: 8,
    responsible: "Renata Castro",
    lastUpdate: "há 1 dia",
    completedInLast30Days: false,
  },
  {
    id: "dash-5",
    buyerId: "buyer-31",
    processId: "proc-31",
    developmentId: "dev-jardins",
    name: "Patrícia Moraes",
    empreendimento: "Jardins do Lago",
    stage: "Finalizado",
    status: "Concluído",
    stuckDays: 0,
    responsible: "Eduarda Prado",
    lastUpdate: "há 3 dias",
    completedInLast30Days: true,
  },
  {
    id: "dash-6",
    buyerId: "buyer-32",
    processId: "proc-32",
    developmentId: "dev-jardins",
    name: "Ricardo Almeida",
    empreendimento: "Jardins do Lago",
    stage: "Contrato",
    status: "Em andamento",
    stuckDays: 1,
    responsible: "Eduarda Prado",
    lastUpdate: "há 4h",
    completedInLast30Days: false,
  },
  {
    id: "dash-7",
    buyerId: "buyer-41",
    processId: "proc-41",
    developmentId: "dev-costa",
    name: "Larissa Couto",
    empreendimento: "Costa Serena",
    stage: "Certificado",
    status: "Aguardando comprador",
    stuckDays: 6,
    responsible: "Julia Martins",
    lastUpdate: "há 7h",
    completedInLast30Days: false,
  },
  {
    id: "dash-8",
    buyerId: "buyer-42",
    processId: "proc-42",
    developmentId: "dev-costa",
    name: "Gustavo Ribeiro",
    empreendimento: "Costa Serena",
    stage: "Registro",
    status: "Em análise",
    stuckDays: 4,
    responsible: "Renata Castro",
    lastUpdate: "há 6h",
    completedInLast30Days: false,
  },
  {
    id: "dash-9",
    buyerId: "buyer-51",
    processId: "proc-51",
    developmentId: "dev-vila",
    name: "Aline Teixeira",
    empreendimento: "Vila Estrela",
    stage: "Finalizado",
    status: "Concluído",
    stuckDays: 0,
    responsible: "Eduarda Prado",
    lastUpdate: "há 6 dias",
    completedInLast30Days: true,
  },
  {
    id: "dash-10",
    buyerId: "buyer-52",
    processId: "proc-52",
    developmentId: "dev-vila",
    name: "Marcelo Paiva",
    empreendimento: "Vila Estrela",
    stage: "Certificado",
    status: "Atrasado",
    stuckDays: 10,
    responsible: "Julia Martins",
    lastUpdate: "há 2 dias",
    completedInLast30Days: false,
  },
  {
    id: "dash-11",
    buyerId: "buyer-61",
    processId: "proc-61",
    developmentId: "dev-mirante",
    name: "Priscila Gomes",
    empreendimento: "Mirante Verde",
    stage: "Contrato",
    status: "Em andamento",
    stuckDays: 2,
    responsible: "Eduarda Prado",
    lastUpdate: "há 3h",
    completedInLast30Days: false,
  },
  {
    id: "dash-12",
    buyerId: "buyer-62",
    processId: "proc-62",
    developmentId: "dev-mirante",
    name: "Rafael Barros",
    empreendimento: "Mirante Verde",
    stage: "Registro",
    status: "Em análise",
    stuckDays: 5,
    responsible: "Renata Castro",
    lastUpdate: "há 8h",
    completedInLast30Days: false,
  },
];

const activityItems: ActivityItem[] = [
  { id: "act-1", action: "Documento enviado", buyerName: "Maria Fernanda Lima", timeLabel: "há 2h" },
  { id: "act-2", action: "Contrato aprovado", buyerName: "João Vitor Azevedo", timeLabel: "há 5h" },
  { id: "act-3", action: "Exigência aberta", buyerName: "Felipe Nogueira", timeLabel: "há 1 dia" },
  { id: "act-4", action: "Registro analisado", buyerName: "Camila Rocha", timeLabel: "há 1h" },
  { id: "act-5", action: "Compra finalizada", buyerName: "Patrícia Moraes", timeLabel: "há 3 dias" },
  { id: "act-6", action: "Comprador respondeu pendência", buyerName: "Larissa Couto", timeLabel: "há 7h" },
  { id: "act-7", action: "Certificado aprovado", buyerName: "Marcelo Paiva", timeLabel: "há 2 dias" },
  { id: "act-8", action: "Dados validados", buyerName: "Priscila Gomes", timeLabel: "há 3h" },
  { id: "act-9", action: "Registro em cartório", buyerName: "Rafael Barros", timeLabel: "há 8h" },
  { id: "act-10", action: "Processo concluído", buyerName: "Aline Teixeira", timeLabel: "há 6 dias" },
];

function formatPercentage(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsLoading(false), 450);
    return () => window.clearTimeout(timeout);
  }, []);

  const empreendimentoOptions = useMemo(
    () => Array.from(new Set(buyers.map((item) => item.empreendimento))),
    [],
  );

  const visibleBuyers = buyers;

  const kpis = useMemo(() => {
    const activeBuyers = visibleBuyers.filter((item) => item.status !== "Concluído").length;
    const inProgress = visibleBuyers.filter((item) => item.stage !== "Finalizado").length;
    const completedLast30Days = visibleBuyers.filter((item) => item.completedInLast30Days).length;
    const overdue = visibleBuyers.filter((item) => item.status === "Atrasado").length;

    return [
      {
        label: "Total de compradores ativos",
        value: `${activeBuyers}`,
        delta: `${formatPercentage(activeBuyers, buyers.length)}% da carteira com processos abertos`,
      },
      {
        label: "Processos em andamento",
        value: `${inProgress}`,
        delta: `${visibleBuyers.filter((item) => item.status === "Em análise").length} em análise agora`,
      },
      {
        label: "Concluídos nos últimos 30 dias",
        value: `${completedLast30Days}`,
        delta: completedLast30Days > 0 ? "+18% vs. período anterior" : "Sem conclusões recentes",
      },
      {
        label: "Em atraso",
        value: `${overdue}`,
        delta: overdue > 0 ? `${overdue} processos exigem escalonamento` : "Nenhum atraso crítico",
      },
    ];
  }, [visibleBuyers]);

  const pipelineStages = useMemo(() => {
    const total = visibleBuyers.length;
    return (["Certificado", "Contrato", "Registro", "Finalizado"] as const).map((stage) => {
      const count = visibleBuyers.filter((item) => item.stage === stage).length;
      return {
        name: stage,
        count,
        percentage: formatPercentage(count, total),
      };
    });
  }, [visibleBuyers]);

  const alertItems = useMemo(
    () =>
      [...visibleBuyers]
        .filter((item) => item.status === "Atrasado" || item.stuckDays >= 5)
        .sort((left, right) => right.stuckDays - left.stuckDays)
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          buyerName: item.name,
          stage: item.stage,
          stuckLabel: item.stuckDays === 1 ? "há 1 dia" : `há ${item.stuckDays} dias`,
          onViewProcess: () =>
            navigate(routes.developmentProcessDetailById(item.developmentId, item.processId)),
        })),
    [navigate, visibleBuyers],
  );

  const performanceMetrics = useMemo(() => {
    const certificateAverage = visibleBuyers
      .filter((item) => item.stage === "Certificado")
      .reduce((total, item) => total + item.stuckDays, 0);
    const certificateCount = visibleBuyers.filter((item) => item.stage === "Certificado").length || 1;
    const totalAverage =
      visibleBuyers.reduce((total, item) => total + item.stuckDays, 0) / Math.max(visibleBuyers.length, 1);
    const onTimeCount = visibleBuyers.filter((item) => item.status !== "Atrasado").length;
    const delayedCount = visibleBuyers.filter((item) => item.status === "Atrasado").length;

    return [
      {
        label: "Tempo médio por etapa",
        value: `${Math.round(certificateAverage / certificateCount)} dias`,
        helper: "Média atual para processos em certificado, onde a carteira mais concentra volume.",
      },
      {
        label: "Tempo médio total",
        value: `${Math.round(totalAverage)} dias`,
        helper: "Tempo médio parado por comprador monitorado no dashboard.",
      },
      {
        label: "% no prazo",
        value: `${formatPercentage(onTimeCount, visibleBuyers.length)}%`,
        helper: "Processos sem atraso formal ou bloqueio crítico na esteira.",
      },
      {
        label: "% com atraso",
        value: `${formatPercentage(delayedCount, visibleBuyers.length)}%`,
        helper: "Carteira que já ultrapassou o SLA ou demanda escalonamento imediato.",
      },
    ];
  }, [visibleBuyers]);

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
        <Skeleton className="h-[480px] rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl space-y-8">
      <KpiCards items={kpis} />

      <Pipeline stages={pipelineStages} />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <AlertsCard items={alertItems} />
        <ActivityFeed items={activityItems} />
      </div>

      <BuyersTable
        items={visibleBuyers}
        empreendimentoOptions={empreendimentoOptions}
        onViewProcess={(item) =>
          navigate(routes.developmentProcessDetailById(item.developmentId, item.processId))
        }
        onViewDetails={(item) => navigate(routes.developmentBuyerDetailById(item.developmentId, item.buyerId))}
      />

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Performance operacional</CardTitle>
            <CardDescription>Indicadores de eficiência para acompanhar prazo, volume e ritmo da carteira.</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CircleCheckBigIcon className="h-4 w-4 text-emerald-600" />
              Carteira saudável
            </div>
            <div className="flex items-center gap-2">
              <Clock3Icon className="h-4 w-4 text-amber-600" />
              Revisar gargalos semanalmente
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <PerformanceMetrics items={performanceMetrics} />
        </CardContent>
      </Card>
    </section>
  );
}
