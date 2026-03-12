import { ArrowDownRight, ArrowUpRight, BarChart3, CircleDollarSign, PiggyBank, Wallet } from "lucide-react";

import { Badge } from "../components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card";
import { cn } from "../lib/cn";
import type { KpiCardsProps } from "./types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

const iconMap = {
  revenue: CircleDollarSign,
  expenses: Wallet,
  profit: PiggyBank,
  runRate: BarChart3,
} as const;

export function KpiCards({ items }: KpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const ItemIcon = iconMap[item.key];
        const isNegative = item.deltaPercentage < 0;
        const DeltaIcon = isNegative ? ArrowDownRight : ArrowUpRight;

        return (
          <Card
            key={item.key}
            className={cn(
              "border-border/70 bg-card/80 shadow-sm",
              item.key === "revenue" && "bg-primary/[0.08]",
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardDescription className="text-sm font-medium">{item.label}</CardDescription>
                <p className="text-2xl font-semibold">{formatCurrency(item.value)}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background/70 shadow-sm">
                <ItemIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant={isNegative ? "danger" : "success"} className="inline-flex items-center gap-1 px-2 py-1 text-[11px]">
                <DeltaIcon className="h-3 w-3" />
                {Math.abs(item.deltaPercentage).toFixed(1)}%
              </Badge>
              <p className="mt-3 text-xs text-muted-foreground">Comparado ao período anterior.</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
