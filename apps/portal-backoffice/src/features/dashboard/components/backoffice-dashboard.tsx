import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Users,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@registra/ui";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  variant?: "default" | "critical" | "warning" | "success";
}

function StatCard({ title, value, description, icon, variant = "default" }: StatCardProps) {
  const isCritical = variant === "critical";
  const isWarning = variant === "warning";
  const isSuccess = variant === "success";

  return (
    <Card
      className={`
        relative overflow-hidden
        ${isCritical ? "border-red-200 bg-red-50/50" : ""}
        ${isWarning ? "border-amber-200 bg-amber-50/50" : ""}
        ${isSuccess ? "border-green-200 bg-green-50/50" : ""}
      `}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle
          className={`
            text-sm font-medium flex items-center gap-2
            ${isCritical ? "text-red-700" : ""}
            ${isWarning ? "text-amber-700" : ""}
            ${isSuccess ? "text-green-700" : "text-muted-foreground"}
          `}
        >
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mt-2">{value}</div>
        <p
          className={`
          text-xs mt-1
          ${isCritical ? "text-red-600/80" : ""}
          ${isWarning ? "text-amber-600/80" : ""}
          ${isSuccess ? "text-green-600/80" : "text-muted-foreground"}
        `}
        >
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function AlertCard({
  title,
  value,
  variant = "warning",
}: {
  title: string;
  value: string | number;
  variant?: "warning" | "critical";
}) {
  const isCritical = variant === "critical";

  return (
    <Card
      className={`
        ${isCritical ? "border-red-200 bg-[#fef2f2]" : "border-amber-200 bg-[#fffbeb]"}
      `}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        {isCritical ? (
          <AlertTriangle className="h-5 w-5 text-red-500" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-500" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function BackofficeDashboard() {
  return (
    <div className="flex flex-col space-y-8 p-4 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Visão Geral</h2>
        <p className="text-muted-foreground mt-1">Dashboard administrativo - Registro360</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="Clientes"
          value="2"
          description="Ativos"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Inadimplentes"
          value="1"
          description="Clientes"
          variant="critical"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          title="Em Andamento"
          value="9"
          description="Processos"
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          title="Concluídos"
          value="4"
          description="Processos"
          variant="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          title="Atrasados"
          value="1"
          description="Processos"
          variant="critical"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="Tickets"
          value="3"
          description="Abertos"
          icon={<MessageSquare className="h-4 w-4" />}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Alertas e Atenção</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <AlertCard title="Processos Críticos" value="1" variant="critical" />
          <AlertCard title="Pendências Longas" value="1" />
          <AlertCard title="Tickets Pendentes" value="3" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Distribuição por Etapas</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-end justify-between px-6 pb-2 pt-8 relative">
            {/* Fake Chart Lines */}
            <div
              className="absolute inset-x-6 inset-y-8 border-y border-dashed border-border/50 flex flex-col justify-between"
              style={{ pointerEvents: "none" }}
            >
              <div className="text-xs text-muted-foreground -translate-x-4 -translate-y-2">4</div>
              <div className="border-t border-border/50 border-dashed translate-y-[50%]">
                <span className="text-xs text-muted-foreground -translate-x-4 -translate-y-2 inline-block">
                  3
                </span>
              </div>
              <div className="border-t border-border/50 border-dashed translate-y-[50%]">
                <span className="text-xs text-muted-foreground -translate-x-4 -translate-y-2 inline-block">
                  2
                </span>
              </div>
              <div className="border-t border-border/50 border-dashed translate-y-[50%]">
                <span className="text-xs text-muted-foreground -translate-x-4 -translate-y-2 inline-block">
                  1
                </span>
              </div>
              <div className="border-t border-border/50 border-dashed mt-auto"></div>
            </div>
            {/* Fake Bars */}
            <div className="w-12 bg-zinc-900 rounded-t-sm h-[25%] z-10" />
            <div className="w-12 bg-zinc-900 rounded-t-sm h-[75%] z-10" />
            <div className="w-12 bg-zinc-900 rounded-t-sm h-[50%] z-10" />
            <div className="w-12 bg-zinc-900 rounded-t-sm h-[0%] z-10" />
            <div className="w-12 bg-zinc-900 rounded-t-sm h-[50%] z-10" />
            <div className="w-12 bg-zinc-900 rounded-t-sm h-[100%] z-10" />
            <div className="w-12 bg-zinc-900 rounded-t-sm h-[0%] z-10" />
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top 10 Processos Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-4 bg-muted/20">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-sm">Apto 301 - Torre 1</h4>
                  <p className="text-sm text-muted-foreground mt-1">Incorporadora Prime</p>
                  <p className="text-sm text-muted-foreground mt-1">Marcos Silva</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex py-1 px-2 text-xs font-semibold bg-white border rounded-full text-foreground shadow-sm">
                    Documentacao
                  </span>
                  <p className="text-xs font-semibold text-red-600 mt-2">9 dias atrasado</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
