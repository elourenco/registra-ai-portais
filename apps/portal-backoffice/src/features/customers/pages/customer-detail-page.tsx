import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@registra/ui";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "@/app/providers/auth-provider";
import { getCustomerDetail } from "@/features/customers/api/customers-api";
import { CustomerStatusBadge } from "@/features/customers/components/customer-status-badge";
import { ApiClientError, getApiErrorMessage } from "@/shared/api/http-client";
import { routes } from "@/shared/constants/routes";

const customerIdParamSchema = z.string().trim().min(1);

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function CustomerDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const { session, logout } = useAuth();

  const customerId = useMemo(() => {
    const parsed = customerIdParamSchema.safeParse(params.customerId);
    return parsed.success ? parsed.data : null;
  }, [params.customerId]);

  const customerQuery = useQuery({
    queryKey: ["customers", "detail", session?.user.id, customerId],
    queryFn: async () => {
      if (!session?.token || !customerId) {
        throw new Error("Sessão inválida para carregar detalhe do customer.");
      }

      return getCustomerDetail({
        token: session.token,
        customerId,
      });
    },
    enabled: Boolean(session?.token && customerId),
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && error.status === 401) {
        return false;
      }

      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (
      customerQuery.isError &&
      customerQuery.error instanceof ApiClientError &&
      customerQuery.error.status === 401
    ) {
      logout();
      navigate(routes.login, { replace: true });
    }
  }, [customerQuery.error, customerQuery.isError, logout, navigate]);

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
              <span className="font-medium">Última compra:</span> {formatDateTime(customer.lastPurchaseAt)}
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
          {customer.notes || <span className="text-muted-foreground">Nenhuma nota cadastrada.</span>}
        </CardContent>
      </Card>
    </motion.section>
  );
}
