import {
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@registra/ui";
import { Building2, GitBranch, MapPin, UserCircle2 } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { SupplierDevelopmentStatus } from "@registra/shared";

import { StatusBadge } from "@/features/registration-core/components/status-badge";
import { DevelopmentAvailabilityOverview } from "@/features/developments/components/development-availability-overview";
import {
  developmentStatusLabels,
  formatCnpj,
} from "@/features/registration-core/core/registration-presenters";
import { buildSupplierWorkspaceSidebar } from "@/features/registration-core/core/workspace-sidebar";
import { useDevelopmentAvailabilityQuery } from "@/features/developments/hooks/use-development-availability-query";
import { useDevelopmentDetailQuery } from "@/features/developments/hooks/use-development-detail-query";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { routes } from "@/shared/constants/routes";
import { useRegisterPageHeader } from "@/shared/hooks/use-register-page-header";
import { useRegisterWorkspaceSidebar } from "@/shared/hooks/use-register-workspace-sidebar";

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium text-foreground">{value}</p>
    </div>
  );
}

const supplierScopedDevelopmentStatusLabels = {
  drafting: "Em estruturação",
  commercialization: "Comercialização",
  registry: "Registro",
  completed: "Concluído",
} satisfies Record<SupplierDevelopmentStatus, string>;

function resolveDevelopmentStatusLabel(
  status: keyof typeof developmentStatusLabels | SupplierDevelopmentStatus,
): string {
  if (status in supplierScopedDevelopmentStatusLabels) {
    return supplierScopedDevelopmentStatusLabels[status as SupplierDevelopmentStatus];
  }

  return developmentStatusLabels[status as keyof typeof developmentStatusLabels];
}

export function DevelopmentDetailPage() {
  const navigate = useNavigate();
  const { buyers, detailQuery, development, developmentId, isSupplierScoped, processes, supplier } =
    useDevelopmentDetailQuery();
  const availabilityQuery = useDevelopmentAvailabilityQuery(developmentId);
  const developmentStatusLabel = development ? resolveDevelopmentStatusLabel(development.status) : null;
  const workspaceSidebar = useMemo(() => {
    if (!development || !supplier) {
      return null;
    }

    return buildSupplierWorkspaceSidebar({
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierCnpj: supplier.cnpj,
    });
  }, [development, supplier]);

  useRegisterWorkspaceSidebar(workspaceSidebar);
  useRegisterPageHeader(
    development
      ? {
          title: development.name,
          description: formatCnpj(development.cnpj),
          leadingAction: supplier
            ? {
                ariaLabel: "Voltar para cliente",
                to: routes.supplierDetailById(supplier.id),
              }
            : {
                ariaLabel: "Voltar para empreendimentos",
                to: routes.developments,
              },
          actions: [
            {
              label: "Cadastrar comprador",
              to: routes.developmentBuyerRegistrationById(development.id),
            },
          ],
          showNotifications: false,
        }
      : null,
  );

  if (!developmentId) {
    return (
      <Card className="border-rose-200 bg-rose-50/70">
        <CardContent className="p-6">
          <p className="font-medium text-rose-700">Empreendimento inválido.</p>
        </CardContent>
      </Card>
    );
  }

  if (detailQuery.isPending || availabilityQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  if (detailQuery.isError || availabilityQuery.isError) {
    return (
      <Card className="border-rose-200 bg-rose-50/70">
        <CardHeader>
          <CardTitle className="text-rose-700">Falha ao carregar empreendimento</CardTitle>
          <CardDescription className="text-rose-700/90">
            {getApiErrorMessage(
              detailQuery.error ?? availabilityQuery.error,
              "Nao foi possível buscar os dados do empreendimento selecionado.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonVariants({ variant: "default" })}
            onClick={() => {
              void detailQuery.refetch();
              void availabilityQuery.refetch();
            }}
          >
            Tentar novamente
          </button>
          <button
            type="button"
            className={buttonVariants({ variant: "outline" })}
            onClick={() =>
              navigate(supplier ? routes.supplierDetailById(supplier.id) : routes.developments)
            }
          >
            Voltar
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!development || !availabilityQuery.data) {
    return (
      <Card className="border-rose-200 bg-rose-50/70">
        <CardContent className="space-y-3 p-6">
          <p className="font-medium text-rose-700">Empreendimento não encontrado.</p>
          <button
            type="button"
            className={buttonVariants({ variant: "outline" })}
            onClick={() => navigate(supplier ? routes.supplierDetailById(supplier.id) : routes.developments)}
          >
            Voltar
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <section className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{development.name}</h1>
              {developmentStatusLabel ? (
                <StatusBadge status={development.status} label={developmentStatusLabel} />
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {supplier ? (
                <>
                  Cliente:{" "}
                  <Link
                    to={routes.supplierDetailById(supplier.id)}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {supplier.name}
                  </Link>
                </>
              ) : (
                "Cliente não encontrado"
              )}
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
            <p className="font-medium">CNPJ do empreendimento</p>
            <p className="text-muted-foreground">{formatCnpj(development.cnpj)}</p>
          </div>
        </div>

        <div className="space-y-6">
          <DevelopmentAvailabilityOverview buyers={buyers} items={availabilityQuery.data.items} />

          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Dados principais</h2>
              <p className="text-sm text-muted-foreground">
                Informações cadastrais centrais do empreendimento.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoBlock label="Nome do empreendimento" value={development.name} />
              <InfoBlock label="Razão social" value={development.legalName ?? "-"} />
              <InfoBlock label="Nome fantasia" value={development.tradeName ?? "-"} />
              <InfoBlock label="Tipo de empreendimento" value={development.developmentType ?? "-"} />
              <InfoBlock label="Cliente vinculado" value={supplier?.name ?? "Cliente não encontrado"} />
              <InfoBlock label="CNPJ do empreendimento" value={formatCnpj(development.cnpj)} />
              <InfoBlock
                label="Status cadastral"
                value={developmentStatusLabel ?? "-"}
              />
              <InfoBlock label="Matrícula mãe" value={development.masterRegistrationNumber ?? "-"} />
            </div>
          </section>

          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Endereço</h2>
              <p className="text-sm text-muted-foreground">
                Endereço completo e dados de localização cadastrados.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border p-4 md:col-span-2 xl:col-span-4">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Endereço completo
                </p>
                <p className="mt-2 font-medium">
                  {[
                    development.address,
                    development.number,
                    development.complement,
                    development.neighborhood,
                    development.city,
                    development.state,
                  ]
                    .filter(Boolean)
                    .join(" - ")}
                </p>
              </div>
              <InfoBlock label="CEP" value={development.postalCode ?? "-"} />
              <InfoBlock label="Número" value={development.number ?? "-"} />
              <InfoBlock label="Complemento" value={development.complement ?? "-"} />
              <InfoBlock label="Bairro" value={development.neighborhood ?? "-"} />
              <InfoBlock label="Cidade" value={development.city ?? "-"} />
              <InfoBlock label="Estado" value={development.state ?? "-"} />
            </div>
          </section>

          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Registro da incorporação</h2>
              <p className="text-sm text-muted-foreground">
                Dados formais da incorporação e do cartório vinculados ao cadastro.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoBlock
                label="Número do registro da incorporação"
                value={development.incorporationRegistrationNumber ?? "-"}
              />
              <InfoBlock
                label="Data do registro"
                value={development.incorporationRegistrationDate ?? "-"}
              />
              <InfoBlock label="Cartório" value={development.registryOfficeName ?? "-"} />
              <InfoBlock label="Número do cartório" value={development.registryOfficeNumber ?? "-"} />
              <InfoBlock label="Cidade do cartório" value={development.registryOfficeCity ?? "-"} />
              <InfoBlock label="Estado do cartório" value={development.registryOfficeState ?? "-"} />
            </div>
          </section>

          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Capacidade operacional</h2>
              <p className="text-sm text-muted-foreground">
                Quantitativos cadastrados para estruturação da carteira.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-xl border p-4">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <UserCircle2 className="h-3.5 w-3.5" />
                  Compradores
                </p>
                <p className="mt-2 font-medium">{buyers.length}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <GitBranch className="h-3.5 w-3.5" />
                  Processos
                </p>
                <p className="mt-2 font-medium">{processes.length}</p>
              </div>
              <InfoBlock
                label="Total de unidades"
                value={development.totalUnits != null ? String(development.totalUnits) : "-"}
              />
              <InfoBlock
                label="Torres / blocos"
                value={development.totalTowers != null ? String(development.totalTowers) : "-"}
              />
              <InfoBlock
                label="Vagas de garagem"
                value={development.parkingSpots != null ? String(development.parkingSpots) : "-"}
              />
            </div>
          </section>
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Resumo operacional</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe o volume consolidado de compradores e processos vinculados a este empreendimento.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Compradores vinculados
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{buyers.length}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Processos vinculados
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{processes.length}</p>
          </div>
        </div>
      </section>
    </section>
  );
}
