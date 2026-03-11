import {
  fetchDashboardSnapshot,
  type DashboardPortalRole,
  type DashboardTransaction,
} from "@registra/shared";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, AlertTriangle, CalendarDays, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "../components/button";
import { Badge } from "../components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card";
import { Skeleton } from "../components/skeleton";
import { ActivityFeedCard } from "./activity-feed-card";
import { KpiCards } from "./kpi-cards";
import { PaymentMethodsCard } from "./payment-methods-card";
import { RevenueBarChart } from "./revenue-bar-chart";
import { SpotlightList } from "./spotlight-list";
import { TeamMembersCard } from "./team-members-card";
import { TransactionSheet } from "./transaction-sheet";
import { TransactionsTable } from "./transactions-table";
import type { DashboardModuleProps } from "./types";

function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-44 rounded-[28px]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={String(index)} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr,1fr]">
        <Skeleton className="h-[360px] rounded-xl" />
        <Skeleton className="h-[360px] rounded-xl" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-[320px] rounded-xl" />
        <Skeleton className="h-[320px] rounded-xl" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
      <Skeleton className="h-[460px] rounded-xl" />
    </div>
  );
}

function DashboardErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-rose-200 bg-rose-50/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-rose-700">
          <AlertTriangle className="h-5 w-5" />
          Erro ao carregar dados
        </CardTitle>
        <CardDescription className="text-rose-700/90">
          Não foi possível carregar o dashboard agora.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DashboardModule({ portalName, portalRole, portalTagline }: DashboardModuleProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<DashboardTransaction | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard-snapshot", portalRole],
    queryFn: () =>
      fetchDashboardSnapshot({
        portalRole,
      }),
    staleTime: 45_000,
  });

  if (dashboardQuery.isPending) {
    return <DashboardLoadingState />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return <DashboardErrorState onRetry={() => dashboardQuery.refetch()} />;
  }

  const { activities, chart, generatedAt, kpis, paymentMethods, spotlights, teamMembers, transactions } =
    dashboardQuery.data;

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden border-border/70 bg-card/80 shadow-sm">
        <CardContent className="relative p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.16),transparent_35%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Badge variant="outline" className="w-fit gap-2 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5" />
                Console administrativo
              </Badge>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{portalName}</h2>
                <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                  {portalTagline ??
                    "Painel consolidado com os componentes principais do admin de referencia, adaptados ao fluxo da Registra AI."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Atualizado em {formatDate(generatedAt)}
                </span>
                <span>42 pagamentos monitorados</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => dashboardQuery.refetch()}
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              <Button type="button" className="gap-2">
                <ArrowDownToLine className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <KpiCards items={kpis} />

      <div className="grid gap-4 xl:grid-cols-[1.6fr,1fr]">
        <RevenueBarChart data={chart} />
        <TeamMembersCard members={teamMembers} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <SpotlightList items={spotlights} />
        </div>
        <div className="xl:col-span-1">
          <ActivityFeedCard activities={activities} />
        </div>
        <div className="xl:col-span-1">
          <PaymentMethodsCard methods={paymentMethods} />
        </div>
      </div>

      <TransactionsTable transactions={transactions} onOpenTransaction={setSelectedTransaction} />
      <TransactionSheet
        transaction={selectedTransaction}
        open={Boolean(selectedTransaction)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTransaction(null);
          }
        }}
      />
    </section>
  );
}

export type { DashboardPortalRole };
