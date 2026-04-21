import { PageHeader } from "@/features/registration-core/components/page-header";

export function DashboardPage() {
  
  return (
    <section className="space-y-6">
      <PageHeader
        title="Visão geral"
        description="Dashboard administrativo do backoffice para acompanhar volume, gargalos, checkpoints obrigatórios e saúde financeira do processo de registro."
      />
    </section>
  );
}
