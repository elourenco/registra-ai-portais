import { Card, CardContent } from "@registra/ui";
import { useNavigate } from "react-router-dom";

import { DevelopmentForm } from "@/features/developments/components/development-form";
import { useCreateDevelopmentMutation } from "@/features/developments/hooks/use-development-queries";
import { routes } from "@/shared/constants/routes";
import { getApiErrorMessage } from "@/shared/api/http-client";

export function DevelopmentCreatePage() {
  const navigate = useNavigate();
  const createDevelopmentMutation = useCreateDevelopmentMutation();

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold">Cadastrar empreendimento</h2>
        <p className="text-sm text-muted-foreground">
          Após salvar, o fluxo redireciona para o detalhe do empreendimento.
        </p>
      </header>

      {createDevelopmentMutation.isError ? (
        <Card className="border-rose-200 bg-rose-50/80">
          <CardContent className="p-5">
            <p className="font-medium text-rose-700">
              {getApiErrorMessage(createDevelopmentMutation.error, "Não foi possível cadastrar o empreendimento.")}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <DevelopmentForm
        submitLabel="Salvar empreendimento"
        cancelLabel="Cancelar"
        isSubmitting={createDevelopmentMutation.isPending}
        onCancel={() => navigate(routes.developments)}
        onSubmit={async (values) => {
          const created = await createDevelopmentMutation.mutateAsync(values);
          navigate(routes.developmentDetailById(created.id));
        }}
      />
    </section>
  );
}
