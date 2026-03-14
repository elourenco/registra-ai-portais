import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@registra/ui";
import { Settings2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SupplierDevelopmentBuyersTable } from "@/features/suppliers/components/supplier-development-buyers-table";
import { SupplierDevelopmentsNav } from "@/features/suppliers/components/supplier-developments-nav";
import { useSupplierDevelopmentContextQuery } from "@/features/suppliers/hooks/use-supplier-development-context-query";
import { useSupplierDevelopmentsQuery } from "@/features/suppliers/hooks/use-supplier-developments-query";
import { useSupplierDetailQuery } from "@/features/suppliers/hooks/use-supplier-detail-query";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { isUnauthorizedError } from "@/shared/api/query-retry";
import { routes } from "@/shared/constants/routes";
import { useRegisterPageHeader } from "@/shared/hooks/use-register-page-header";
import { useUnauthorizedSessionRedirect } from "@/shared/hooks/use-unauthorized-session-redirect";

function SupplierDetailPageSkeleton() {
  return (
    <section className="space-y-4">
      <Skeleton className="h-10 w-48 rounded-md" />
      <Skeleton className="h-56 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </section>
  );
}

export function SupplierDetailPage() {
  const navigate = useNavigate();
  const [selectedDevelopmentId, setSelectedDevelopmentId] = useState<string | null>(null);
  const { supplierId, supplierQuery } = useSupplierDetailQuery();
  const developmentsQuery = useSupplierDevelopmentsQuery(supplierId);
  const developmentContextQuery = useSupplierDevelopmentContextQuery(selectedDevelopmentId);
  const supplier = supplierQuery.data;
  const developments = developmentsQuery.data ?? [];
  const selectedDevelopment = developmentContextQuery.data?.development ?? null;
  const selectedDevelopmentBuyers = developmentContextQuery.data?.buyers ?? [];
  const selectedDevelopmentProcesses = developmentContextQuery.data?.processes ?? [];
  const processesById = useMemo(
    () => new Map(selectedDevelopmentProcesses.map((item) => [item.id, item])),
    [selectedDevelopmentProcesses],
  );

  useUnauthorizedSessionRedirect(
    (supplierQuery.isError && isUnauthorizedError(supplierQuery.error)) ||
      (developmentsQuery.isError && isUnauthorizedError(developmentsQuery.error)) ||
      (developmentContextQuery.isError && isUnauthorizedError(developmentContextQuery.error)),
  );

  useRegisterPageHeader(
    supplier && supplierId
      ? {
          title: supplier.legalName,
          description: "",
          actions: [],
          leadingAction: {
            ariaLabel: "Voltar para clientes",
            onClick: () => navigate(routes.suppliers),
          },
          utilityAction: {
            ariaLabel: "Configuração do cliente",
            icon: Settings2,
            to: routes.supplierSettingsById(supplierId),
          },
        }
      : null,
  );

  useEffect(() => {
    if (!developments.length) {
      setSelectedDevelopmentId(null);
      return;
    }

    const hasSelectedDevelopment = developments.some((item) => item.id === selectedDevelopmentId);

    if (!hasSelectedDevelopment) {
      setSelectedDevelopmentId(developments[0].id);
    }
  }, [developments, selectedDevelopmentId]);

  if (!supplierId) {
    return (
      <Card className="border-rose-200 bg-rose-50/60">
        <CardHeader>
          <CardTitle className="text-rose-700">Cliente inválido</CardTitle>
          <CardDescription className="text-rose-700/90">
            O identificador informado não é válido para consulta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={() => navigate(routes.suppliers)}>
            Voltar para a lista
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (supplierQuery.isPending || developmentsQuery.isPending) {
    return <SupplierDetailPageSkeleton />;
  }

  if (supplierQuery.isError) {
    return (
      <Card className="border-rose-200 bg-rose-50/60">
        <CardHeader>
          <CardTitle className="text-rose-700">Falha ao carregar cliente</CardTitle>
          <CardDescription className="text-rose-700/90">
            {getApiErrorMessage(
              supplierQuery.error,
              "Não foi possível buscar os dados do cliente selecionado.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => supplierQuery.refetch()}>
            Tentar novamente
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(routes.suppliers)}>
            Voltar para a lista
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (developmentsQuery.isError) {
    return (
      <Card className="border-rose-200 bg-rose-50/60">
        <CardHeader>
          <CardTitle className="text-rose-700">Falha ao carregar empreendimentos</CardTitle>
          <CardDescription className="text-rose-700/90">
            {getApiErrorMessage(
              developmentsQuery.error,
              "Não foi possível buscar os empreendimentos do cliente selecionado.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => developmentsQuery.refetch()}>
            Tentar novamente
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(routes.suppliers)}>
            Voltar para a lista
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleOpenDevelopmentDetails = (development: { id: string }) => {
    navigate(routes.supplierDevelopmentDetailById(supplierId, development.id));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <section className="space-y-4">
        {developments.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Nenhum empreendimento encontrado para este cliente.
          </p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <SupplierDevelopmentsNav
              items={developments}
              onOpenDetails={handleOpenDevelopmentDetails}
              onSelectDevelopment={setSelectedDevelopmentId}
              selectedDevelopmentId={selectedDevelopmentId}
            />

            {developmentContextQuery.isPending ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-72 w-full rounded-xl" />
              </div>
            ) : developmentContextQuery.isError ? (
              <Card className="border-rose-200 bg-rose-50/60">
                <CardHeader>
                  <CardTitle className="text-rose-700">Falha ao carregar empreendimento</CardTitle>
                  <CardDescription className="text-rose-700/90">
                    {getApiErrorMessage(
                      developmentContextQuery.error,
                      "Não foi possível buscar o contexto do empreendimento selecionado.",
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" onClick={() => developmentContextQuery.refetch()}>
                    Tentar novamente
                  </Button>
                </CardContent>
              </Card>
            ) : selectedDevelopment ? (
              selectedDevelopmentBuyers.length === 0 ? (
                <section className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">Compradores</h3>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        navigate(routes.developmentBuyerRegistrationById(selectedDevelopment.id))
                      }
                    >
                      Adicionar comprador manualmente
                    </Button>
                  </div>
                  <section className="rounded-3xl border border-dashed border-border/70 bg-card/60 p-8 text-sm text-muted-foreground">
                    Nenhum comprador encontrado para o empreendimento {selectedDevelopment.name}.
                  </section>
                </section>
              ) : (
                <section className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">Compradores</h3>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        navigate(routes.developmentBuyerRegistrationById(selectedDevelopment.id))
                      }
                    >
                      Adicionar comprador manualmente
                    </Button>
                  </div>
                  <SupplierDevelopmentBuyersTable
                    buyers={selectedDevelopmentBuyers}
                    onOpenRow={(buyer, process) => {
                      if (process) {
                        navigate(
                          routes.supplierDevelopmentBuyerProcessDetailById(
                            supplierId,
                            selectedDevelopment.id,
                            buyer.id,
                            process.id,
                          ),
                        );
                        return;
                      }

                      navigate(
                        routes.supplierDevelopmentBuyerDetailById(
                          supplierId,
                          selectedDevelopment.id,
                          buyer.id,
                        ),
                      );
                    }}
                    processesById={processesById}
                  />
                </section>
              )
            ) : null}
          </div>
        )}
      </section>
    </motion.section>
  );
}
