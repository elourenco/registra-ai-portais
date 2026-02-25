import { ArrowDownRight, ArrowUpRight, BarChart3, CircleDollarSign, PiggyBank, Wallet } from "lucide-react";

import { Badge } from "../components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card";
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
          <Card key={item.key} className="border-border/70 bg-card/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="text-sm font-medium">{item.label}</CardDescription>
              <ItemIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{formatCurrency(item.value)}</CardTitle>
              <Badge
                variant={isNegative ? "danger" : "success"}
                className="mt-3 inline-flex items-center gap-1 px-2 py-1 text-[11px]"
              >
                <DeltaIcon className="h-3 w-3" />
                {Math.abs(item.deltaPercentage).toFixed(1)}%
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
