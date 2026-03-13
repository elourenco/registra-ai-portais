import type { Development } from "@registra/shared";
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

import { SupplierDevelopmentEditSheet } from "@/features/suppliers/components/supplier-development-edit-sheet";
import { useRegistrationWorkspaceQuery } from "@/features/registration-core/hooks/use-registration-workspace-query";
import { SupplierDevelopmentBuyersTable } from "@/features/suppliers/components/supplier-development-buyers-table";
import { SupplierDevelopmentsNav } from "@/features/suppliers/components/supplier-developments-nav";
import { useSupplierDetailQuery } from "@/features/suppliers/hooks/use-supplier-detail-query";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { isUnauthorizedError } from "@/shared/api/query-retry";
import { routes } from "@/shared/constants/routes";
import { useRegisterPageHeader } from "@/shared/hooks/use-register-page-header";
import { useUnauthorizedSessionRedirect } from "@/shared/hooks/use-unauthorized-session-redirect";

export function SupplierDetailPage() {
  const navigate = useNavigate();
  const [selectedDevelopmentId, setSelectedDevelopmentId] = useState<string | null>(null);
  const [editingDevelopmentId, setEditingDevelopmentId] = useState<string | null>(null);
  const [developmentOverrides, setDevelopmentOverrides] = useState<Record<string, Development>>({});
  const { supplierId, supplierQuery } = useSupplierDetailQuery();
  const workspaceQuery = useRegistrationWorkspaceQuery();
  const supplier = supplierQuery.data;
  const developments = useMemo(
    () =>
      (workspaceQuery.data?.developments ?? [])
        .filter((item) => (supplierId ? item.supplierId === supplierId : true))
        .map((item) => developmentOverrides[item.id] ?? item),
    [developmentOverrides, supplierId, workspaceQuery.data?.developments],
  );
  const selectedDevelopment = useMemo(
    () => developments.find((item) => item.id === selectedDevelopmentId) ?? developments[0] ?? null,
    [developments, selectedDevelopmentId],
  );
  const editingDevelopment = useMemo(
    () => developments.find((item) => item.id === editingDevelopmentId) ?? null,
    [developments, editingDevelopmentId],
  );
  const buyers = workspaceQuery.data?.buyers ?? [];
  const workspaceProcesses = workspaceQuery.data?.processes ?? [];
  const selectedDevelopmentBuyers = useMemo(
    () =>
      selectedDevelopment
        ? buyers.filter((buyer) => buyer.developmentId === selectedDevelopment.id)
        : [],
    [buyers, selectedDevelopment],
  );
  const selectedDevelopmentProcesses = useMemo(
    () =>
      selectedDevelopment
        ? workspaceProcesses.filter((process) => process.developmentId === selectedDevelopment.id)
        : [],
    [selectedDevelopment, workspaceProcesses],
  );
  const processesByBuyerId = useMemo(
    () => new Map(selectedDevelopmentProcesses.map((item) => [item.buyerId, item])),
    [selectedDevelopmentProcesses],
  );

  useUnauthorizedSessionRedirect(
    supplierQuery.isError && isUnauthorizedError(supplierQuery.error),
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

  if (supplierQuery.isPending) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-10 w-48 rounded-md" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </section>
    );
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
  const handleEditDevelopment = (development: Development) => {
    setEditingDevelopmentId(development.id);
  };
  const handleOpenDevelopmentDetails = (development: Development) => {
    if (!supplierId) {
      return;
    }

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
              onEditDevelopment={handleEditDevelopment}
              onSelectDevelopment={setSelectedDevelopmentId}
              selectedDevelopmentId={selectedDevelopment?.id ?? null}
            />

            {selectedDevelopment ? (
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
                      if (!supplierId) {
                        return;
                      }

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
                    processesByBuyerId={processesByBuyerId}
                  />
                </section>
              )
            ) : null}
          </div>
        )}
      </section>

      <SupplierDevelopmentEditSheet
        development={editingDevelopment}
        onOpenChange={(open) => {
          if (!open) {
            setEditingDevelopmentId(null);
          }
        }}
        onSave={(development) => {
          setDevelopmentOverrides((current) => ({
            ...current,
            [development.id]: development,
          }));
          setEditingDevelopmentId(null);
        }}
        open={Boolean(editingDevelopment)}
      />
    </motion.section>
  );
}
