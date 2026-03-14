import { formatCnpj } from "@registra/shared";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from "@registra/ui";
import { Settings2 } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { SupplierInfoItem } from "@/features/suppliers/components/supplier-info-item";
import { SupplierInternalUsersTable } from "@/features/suppliers/components/supplier-internal-users-table";
import { useSupplierDetailQuery } from "@/features/suppliers/hooks/use-supplier-detail-query";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { isUnauthorizedError } from "@/shared/api/query-retry";
import { routes } from "@/shared/constants/routes";
import { useRegisterPageHeader } from "@/shared/hooks/use-register-page-header";
import { useUnauthorizedSessionRedirect } from "@/shared/hooks/use-unauthorized-session-redirect";
import { formatDateTime } from "@/shared/utils/format-date-time";

export function SupplierSettingsPage() {
  const navigate = useNavigate();
  const { supplierId, supplierQuery } = useSupplierDetailQuery();

  const supplier = supplierQuery.data;

  useUnauthorizedSessionRedirect(supplierQuery.isError && isUnauthorizedError(supplierQuery.error));

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
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
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

  const resolvedSupplier = supplierQuery.data!;
  const workflowLabel =
    resolvedSupplier.workflowName ??
    (resolvedSupplier.workflowId ? "Workflow customizado" : "Workflow default");
  const internalUsers = resolvedSupplier.internalUsers;

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Informações</h2>
          <p className="text-sm text-muted-foreground">
            Dados cadastrais e acessos internos usados para operar a carteira deste cliente.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SupplierInfoItem label="CNPJ" value={formatCnpj(resolvedSupplier.cnpj)} />
          <SupplierInfoItem label="Nome fantasia" value={resolvedSupplier.tradeName} />
          <SupplierInfoItem label="Contato" value={resolvedSupplier.contactName} />
          <SupplierInfoItem label="E-mail" value={resolvedSupplier.email} />
          <SupplierInfoItem label="Telefone" value={resolvedSupplier.phone} />
          <SupplierInfoItem label="Workflow" value={workflowLabel} />
          <SupplierInfoItem
            label="Localidade"
            value={
              resolvedSupplier.city || resolvedSupplier.state
                ? [resolvedSupplier.city, resolvedSupplier.state].filter(Boolean).join(" - ")
                : null
            }
          />
          <SupplierInfoItem
            label="Última atualização"
            value={formatDateTime(resolvedSupplier.updatedAt)}
          />
          <div className="sm:col-span-2 xl:col-span-4 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Observações
            </p>
            <p className="mt-1 text-sm text-foreground">
              {resolvedSupplier.notes || "Nenhuma observação cadastrada."}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Usuários internos</h2>
          <p className="text-sm text-muted-foreground">
            Pessoas do cliente com acesso ou participação operacional no portal.
          </p>
        </div>

        {internalUsers.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Nenhum usuario interno cadastrado para este supplier.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {internalUsers.length} usuario(s) interno(s) encontrados.
            </p>
            <SupplierInternalUsersTable items={internalUsers} />
          </div>
        )}
      </section>
    </motion.section>
  );
}
