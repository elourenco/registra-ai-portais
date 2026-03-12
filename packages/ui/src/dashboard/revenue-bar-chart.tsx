import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card";
import { ChartResponsiveContainer } from "./chart-responsive-container";
import type { RevenueBarChartProps } from "./types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export const RevenueBarChart = memo(function RevenueBarChart({ data }: RevenueBarChartProps) {
  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Visão mensal</CardTitle>
        <CardDescription>Receita e custo recorrente em uma composição inspirada no admin de referência.</CardDescription>
      </CardHeader>
      <CardContent className="h-[340px]">
        <ChartResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="period" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={formatCurrency} width={90} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
              }}
            />
            <Legend />
            <Bar dataKey="revenue" name="Receita" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expenses" name="Despesas" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartResponsiveContainer>
      </CardContent>
    </Card>
  );
});
