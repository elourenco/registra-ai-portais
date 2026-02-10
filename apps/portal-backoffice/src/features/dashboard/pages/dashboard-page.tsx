import {
  Building2Icon,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CircleCheckBigIcon,
  Clock3Icon,
  FileTextIcon,
} from "@registra/ui";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { portalConfig } from "@/shared/config/portal-config";
import { MockChart } from "@/widgets/dashboard/mock-chart";

const metrics = [
  { label: "Solicitações abertas", value: "128", delta: "+12% vs. última semana", icon: FileTextIcon },
  { label: "Fornecedores ativos", value: "53", delta: "+4 novos cadastros", icon: Building2Icon },
  { label: "Pendências", value: "17", delta: "-6 desde ontem", icon: Clock3Icon },
  { label: "Concluídos", value: "84", delta: "+19 finalizados", icon: CircleCheckBigIcon },
];

export function DashboardPage() {
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Dashboard mock - {portalConfig.name}</h2>
        <p className="text-muted-foreground">
          Visão executiva de operações e regularização documental.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <div key={metric.label} className="relative">
            <metric.icon className="absolute right-5 top-5 h-4 w-4 text-muted-foreground" />
            <MetricCard
              index={index}
              label={metric.label}
              value={metric.value}
              delta={metric.delta}
            />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MockChart />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fila de prioridades</CardTitle>
            <CardDescription>Itens críticos para ação imediata</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="rounded-md border bg-muted/40 p-3">
                Renovação de certidão fiscal - 5 fornecedores
              </li>
              <li className="rounded-md border bg-muted/40 p-3">
                Validação de documentos societários - 3 pendências
              </li>
              <li className="rounded-md border bg-muted/40 p-3">
                Aprovação de cadastro com SLA de 24h
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
