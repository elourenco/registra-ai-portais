import {
  fetchDashboardSnapshot,
  type DashboardPortalRole,
  type DashboardTransaction,
} from "@registra/shared";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useState } from "react";

import { Button } from "../components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card";
import { Skeleton } from "../components/skeleton";
import { KpiCards } from "./kpi-cards";
import { RevenueBarChart } from "./revenue-bar-chart";
import { TransactionSheet } from "./transaction-sheet";
import { TransactionsTable } from "./transactions-table";

interface DashboardModuleProps {
  portalName: string;
  portalRole: DashboardPortalRole;
}

function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-80" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={String(index)} className="h-36 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[360px] rounded-xl" />
      <Skeleton className="h-[420px] rounded-xl" />
    </div>
  );
}

function DashboardErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-rose-200 bg-rose-50/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-rose-700">
          <AlertTriangle className="h-5 w-5" />
          Error ao carregar dados
        </CardTitle>
        <CardDescription className="text-rose-700/90">
          Nao foi possivel carregar o dashboard agora.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

export function DashboardModule({ portalName, portalRole }: DashboardModuleProps) {
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

  const { chart, generatedAt, kpis, transactions } = dashboardQuery.data;

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">{portalName} Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Ultima atualizacao em{" "}
          {new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(generatedAt))}
        </p>
      </header>

      <KpiCards items={kpis} />
      <RevenueBarChart data={chart} />
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
