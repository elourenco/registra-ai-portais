import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@registra/ui";

import { PageHeader } from "@/features/operations/components/page-header";

export function SettingsPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Governança operacional para workflow, checkpoints obrigatórios, cobrança única por processo e controles manuais de avanço."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Dependência entre blocos</CardTitle>
            <CardDescription>Certificado → Contrato → Registro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Um bloco só inicia quando o anterior estiver aprovado.</p>
            <p>Backoffice pode forçar avanço manualmente quando houver exceção operacional.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cobrança por processo</CardTitle>
            <CardDescription>Modelo de monetização único por criação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Valor unitário padrão: R$ 500,00.</p>
            <p>Um processo nunca pode ser cobrado duas vezes.</p>
            <p>Status previstos: pendente, pago e isento.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auditoria e histórico</CardTitle>
            <CardDescription>Rastreabilidade completa da jornada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Eventos registram usuário, data, ação e observação.</p>
            <p>Inclui alteração de etapa, solicitação, resposta do cliente, documento e exigência.</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
