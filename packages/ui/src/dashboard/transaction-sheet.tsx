import { getDashboardMeta } from "@registra/shared";

import { Badge } from "../components/badge";
import { Separator } from "../components/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../components/sheet";
import type { TransactionSheetProps } from "./types";

const dashboardMeta = getDashboardMeta();

const statusVariantMap = {
  paid: "success",
  pending: "warning",
  failed: "danger",
  refunded: "secondary",
} as const;

function getMetaLabel(
  key: string,
  source: Array<{
    key: string;
    label: string;
  }>,
): string {
  return source.find((item) => item.key === key)?.label ?? key;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function TransactionSheet({ onOpenChange, open, transaction }: TransactionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {transaction ? (
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>Detalhes da transação</SheetTitle>
              <SheetDescription>Visualize informações completas da transação selecionada.</SheetDescription>
            </SheetHeader>

            <section className="space-y-3 rounded-xl border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Resumo</p>
              <h3 className="text-lg font-semibold">{transaction.description}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariantMap[transaction.status]}>
                  {getMetaLabel(transaction.status, dashboardMeta.statuses)}
                </Badge>
                <Badge variant="outline">{getMetaLabel(transaction.category, dashboardMeta.categories)}</Badge>
                <Badge variant="outline">{getMetaLabel(transaction.method, dashboardMeta.methods)}</Badge>
              </div>
            </section>

            <section className="rounded-xl border bg-background/60 p-4">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Data</dt>
                  <dd className="font-medium">{formatDate(transaction.date)}</dd>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Valor</dt>
                  <dd className="text-base font-semibold">{formatCurrency(transaction.value)}</dd>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">ID</dt>
                  <dd className="font-mono text-xs">{transaction.id}</dd>
                </div>
              </dl>
            </section>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
