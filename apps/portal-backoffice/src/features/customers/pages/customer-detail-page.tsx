import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@registra/ui";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

import { CustomerStatusBadge } from "@/features/customers/components/customer-status-badge";
import { useCustomerDetailQuery } from "@/features/customers/hooks/use-customer-detail-query";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { isUnauthorizedError } from "@/shared/api/query-retry";
import { routes } from "@/shared/constants/routes";
import { useUnauthorizedSessionRedirect } from "@/shared/hooks/use-unauthorized-session-redirect";
import { formatDateTime } from "@/shared/utils/format-date-time";

export function CustomerDetailPage() {
  const navigate = useNavigate();
  const { customerId, customerQuery } = useCustomerDetailQuery();

  useUnauthorizedSessionRedirect(customerQuery.isError && isUnauthorizedError(customerQuery.error));

  if (!customerId) {
    return (
      <Card className="border-rose-200 bg-rose-50/60">
        <CardHeader>
          <CardTitle className="text-rose-700">Customer inválido</CardTitle>
          <CardDescription className="text-rose-700/90">
            O identificador informado não é válido para consulta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={() => navigate(routes.customers)}>
            Voltar para a lista
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (customerQuery.isPending) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-10 w-48 rounded-md" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </section>
    );
  }

  if (customerQuery.isError) {
    return (
      <Card className="border-rose-200 bg-rose-50/60">
        <CardHeader>
          <CardTitle className="text-rose-700">Falha ao carregar customer</CardTitle>
          <CardDescription className="text-rose-700/90">
            {getApiErrorMessage(
              customerQuery.error,
              "Não foi possível buscar os dados do customer selecionado.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => customerQuery.refetch()}>
            Tentar novamente
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(routes.customers)}>
            Voltar para a lista
          </Button>
        </CardContent>
      </Card>
    );
  }

  const customer = customerQuery.data;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold">{customer.fullName}</h2>
            <CustomerStatusBadge status={customer.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            ID {customer.id} · Cadastro em {formatDateTime(customer.createdAt)}
          </p>
        </div>

        <Button type="button" variant="outline" onClick={() => navigate(routes.customers)}>
          Voltar para customers
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Informações do customer</CardTitle>
            <CardDescription>Dados principais para operação e atendimento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="font-medium">Documento:</span> {customer.document}
            </p>
            <p>
              <span className="font-medium">Segmento:</span> {customer.segment}
            </p>
            <p>
              <span className="font-medium">E-mail:</span> {customer.email}
            </p>
            <p>
              <span className="font-medium">Telefone:</span> {customer.phone}
            </p>
            <p>
              <span className="font-medium">Última compra:</span>{" "}
              {formatDateTime(customer.lastPurchaseAt)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Endereço</CardTitle>
            <CardDescription>Localização principal cadastrada do customer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {customer.address ? (
              <>
                <p>{customer.address.street}</p>
                <p>
                  {customer.address.city} - {customer.address.state}
                </p>
                <p>CEP {customer.address.zipCode}</p>
              </>
            ) : (
              <p className="text-muted-foreground">Endereço não informado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Notas internas</CardTitle>
          <CardDescription>Anotações relevantes para o time de backoffice.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          {customer.notes || (
            <span className="text-muted-foreground">Nenhuma nota cadastrada.</span>
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
}
