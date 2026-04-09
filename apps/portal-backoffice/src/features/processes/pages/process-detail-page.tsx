import { Button, Card, CardContent } from "@registra/ui";
import { useMemo, useState } from "react";
import { ApiProcessDetailView } from "@/features/processes/components/api-process-detail-view";
import { ProcessBuyerInfoSheet } from "@/features/processes/components/process-buyer-info-sheet";
import { useProcessDetailQuery } from "@/features/processes/hooks/use-process-detail-query";
import { buildSupplierWorkspaceSidebar } from "@/features/registration-core/core/workspace-sidebar";
import { useSupplierDetailQuery } from "@/features/suppliers/hooks/use-supplier-detail-query";
import { useRegisterPageHeader } from "@/shared/hooks/use-register-page-header";
import { useRegisterWorkspaceSidebar } from "@/shared/hooks/use-register-workspace-sidebar";

export function ProcessDetailPage() {
  const { processId, processQuery, supplierId } = useProcessDetailQuery();
  const { supplierQuery } = useSupplierDetailQuery(supplierId ?? null);
  const detail = processQuery.data?.detail ?? null;
  const operational = processQuery.data?.operational ?? null;
  const [buyerInfoOpen, setBuyerInfoOpen] = useState(false);
  const resolvedSupplierName =
    supplierQuery.data?.legalName ??
    detail?.supplierName ??
    (supplierId ? `Cliente #${supplierId}` : null);
  const resolvedSupplierCnpj = supplierQuery.data?.cnpj ?? null;
  const workspaceSidebar = useMemo(() => {
    if (!supplierId || !resolvedSupplierName) {
      return null;
    }

    return buildSupplierWorkspaceSidebar({
      supplierId,
      supplierName: resolvedSupplierName,
      supplierCnpj: resolvedSupplierCnpj ?? "-",
    });
  }, [resolvedSupplierCnpj, resolvedSupplierName, supplierId]);

  useRegisterWorkspaceSidebar(workspaceSidebar);
  useRegisterPageHeader(
    detail
      ? {
          title: detail.name ?? detail.propertyLabel,
          description: `Processo ${detail.id}`,
          actions: [],
          showNotifications: false,
        }
      : null,
  );

  if (!processId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="font-medium">Processo inválido.</p>
        </CardContent>
      </Card>
    );
  }

  if (processQuery.isPending) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="h-32 animate-pulse p-6" />
        </Card>
        <Card>
          <CardContent className="h-60 animate-pulse p-6" />
        </Card>
      </div>
    );
  }

  if (processQuery.isError || !processQuery.data) {
    return (
      <Card className="border-rose-200 bg-rose-50/70">
        <CardContent className="flex items-center justify-between gap-3 p-6">
          <div>
            <p className="font-medium text-rose-700">Falha ao carregar o processo.</p>
            <p className="text-sm text-rose-700/80">Revise o identificador e tente novamente.</p>
          </div>
          <Button type="button" onClick={() => processQuery.refetch()}>
            Recarregar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!detail || !operational) {
    return (
      <Card className="border-rose-200 bg-rose-50/70">
        <CardContent className="p-6">
          <p className="font-medium text-rose-700">Detalhe do processo indisponível.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <>
      <ProcessBuyerInfoSheet
        open={buyerInfoOpen}
        onOpenChange={setBuyerInfoOpen}
        variant="api"
        detail={detail}
        supplierName={resolvedSupplierName ?? null}
        supplierDetail={supplierQuery.data ?? null}
      />
      <ApiProcessDetailView
        detail={detail}
        operational={operational}
        supplierName={resolvedSupplierName}
        onRefetch={() => processQuery.refetch()}
        onOpenBuyerInfo={() => setBuyerInfoOpen(true)}
      />
    </>
  );
}
