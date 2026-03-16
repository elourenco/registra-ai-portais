import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@registra/ui";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { BuyerForm } from "@/features/developments/components/buyer-form";
import { useDevelopmentAvailabilityQuery } from "@/features/developments/hooks/use-development-availability-queries";
import { useCreateBuyerMutation, useDevelopmentDetailQuery } from "@/features/developments/hooks/use-development-queries";
import { routes } from "@/shared/constants/routes";
import { getApiErrorMessage } from "@/shared/api/http-client";

const developmentIdParamSchema = z.string().trim().min(1);

export function DevelopmentBuyerCreatePage() {
  const navigate = useNavigate();
  const params = useParams<{ developmentId: string }>();
  const developmentId = useMemo(() => {
    const parsed = developmentIdParamSchema.safeParse(params.developmentId);
    return parsed.success ? parsed.data : null;
  }, [params.developmentId]);
  const developmentQuery = useDevelopmentDetailQuery(developmentId);
  const availabilityQuery = useDevelopmentAvailabilityQuery(developmentId);
  const createBuyerMutation = useCreateBuyerMutation(developmentId ?? "");

  if (!developmentId) {
    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="p-5">
          <p className="font-medium text-rose-700">Empreendimento inválido para cadastro do comprador.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold">Cadastrar comprador</h2>
        <p className="text-sm text-muted-foreground">
          {developmentQuery.data?.development.name
            ? `Novo comprador para ${developmentQuery.data.development.name}.`
            : "Preencha os dados básicos e os dados da compra do imóvel."}
        </p>
      </header>

      {createBuyerMutation.isError ? (
        <Card className="border-rose-200 bg-rose-50/80">
          <CardContent className="p-5">
            <p className="font-medium text-rose-700">
              {getApiErrorMessage(createBuyerMutation.error, "Não foi possível cadastrar o comprador.")}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <BuyerForm
        availableItems={(availabilityQuery.data?.items ?? []).filter((item) => item.status === "available")}
        isSubmitting={createBuyerMutation.isPending}
        onCancel={() => navigate(routes.developmentDetailById(developmentId))}
        onSubmit={async (values) => {
          await createBuyerMutation.mutateAsync(values);
          navigate(routes.developmentDetailById(developmentId));
        }}
      />

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={() => navigate(routes.developmentDetailById(developmentId))}>
          Voltar ao empreendimento
        </Button>
      </div>
    </section>
  );
}
