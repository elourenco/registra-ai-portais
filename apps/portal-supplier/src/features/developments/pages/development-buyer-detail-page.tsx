import { useQueries } from "@tanstack/react-query";
import { normalizeDigits } from "@registra/shared";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  MenuIcon,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@registra/ui";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "@/app/providers/auth-provider";
import { getDevelopmentDetail } from "@/features/developments/api/developments-api";
import { BuyerForm } from "@/features/developments/components/buyer-form";
import {
  buildDevelopmentAddress,
  developmentStatusLabels,
  developmentTypeLabels,
  formatBuyerPurchaseValue,
  processStatusLabels,
  type BuyerRegistrationFormInput,
  type DevelopmentBuyer,
  type DevelopmentDetail,
  type DevelopmentDetailResult,
} from "@/features/developments/core/developments-schema";
import { useDevelopmentAvailabilityQuery } from "@/features/developments/hooks/use-development-availability-queries";
import { useDevelopmentDetailQuery, useDevelopmentsQuery } from "@/features/developments/hooks/use-development-queries";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { routes } from "@/shared/constants/routes";

const paramsSchema = z.object({
  developmentId: z.string().trim().min(1),
  buyerId: z.string().trim().min(1),
});

interface BuyerDevelopmentRelationship {
  developmentId: string;
  developmentName: string;
  development: DevelopmentDetail;
  buyer: DevelopmentBuyer;
  processCount: number;
  pendingRequirements: number;
  currentStageLabel: string;
  processes: DevelopmentDetailResult["processes"];
}

function buildBuyerFormInitialValues(
  buyer: DevelopmentBuyer,
): Partial<BuyerRegistrationFormInput> {
  return {
    name: buyer.name,
    cpf: buyer.cpf,
    email: buyer.email === "-" ? "" : buyer.email,
    phone: buyer.phone,
    maritalStatus: buyer.maritalStatus ?? "single",
    nationality: buyer.nationality ?? "Brasileiro(a)",
    profession: buyer.profession ?? "",
    availabilityItemId: buyer.availabilityItemId ?? "",
    unitLabel: buyer.unitLabel ?? "",
    acquisitionType: buyer.acquisitionType ?? "financing",
    purchaseValue: buyer.purchaseValue ? formatBuyerPurchaseValue(buyer.purchaseValue) : "",
    contractDate: buyer.contractDate ?? "",
    notes: buyer.notes ?? "",
  };
}

function findMatchingBuyer(
  buyers: DevelopmentBuyer[],
  referenceBuyer: DevelopmentBuyer,
  referenceBuyerId: string,
) {
  const referenceCpf = normalizeDigits(referenceBuyer.cpf);
  const referenceEmail = referenceBuyer.email.trim().toLowerCase();

  return buyers.find((candidate) => {
    if (candidate.id === referenceBuyerId) {
      return true;
    }

    const candidateCpf = normalizeDigits(candidate.cpf);
    const candidateEmail = candidate.email.trim().toLowerCase();

    if (referenceCpf && candidateCpf && referenceCpf === candidateCpf) {
      return true;
    }

    return Boolean(referenceEmail && candidateEmail && referenceEmail === candidateEmail);
  });
}

export function DevelopmentBuyerDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ developmentId: string; buyerId: string }>();
  const parsedParams = paramsSchema.safeParse(params);
  const { session } = useAuth();
  const [isBuyerEditOpen, setBuyerEditOpen] = useState(false);
  const [editingRelationshipId, setEditingRelationshipId] = useState<string | null>(null);
  const [drawerMessage, setDrawerMessage] = useState<string | null>(null);

  const developmentId = parsedParams.success ? parsedParams.data.developmentId : null;
  const buyerId = parsedParams.success ? parsedParams.data.buyerId : null;

  const currentDevelopmentQuery = useDevelopmentDetailQuery(developmentId);
  const developmentsQuery = useDevelopmentsQuery();
  const relationshipAvailabilityQuery = useDevelopmentAvailabilityQuery(editingRelationshipId);

  const currentBuyer = useMemo(() => {
    if (!currentDevelopmentQuery.data || !buyerId) {
      return null;
    }

    return currentDevelopmentQuery.data.buyers.find((buyer) => buyer.id === buyerId) ?? null;
  }, [buyerId, currentDevelopmentQuery.data]);

  const crossDevelopmentQueries = useQueries({
    queries:
      session?.token && currentBuyer && developmentsQuery.data?.items
        ? developmentsQuery.data.items.map((development) => ({
            queryKey: ["supplier", "buyer-detail", "development", development.id],
            queryFn: async () =>
              getDevelopmentDetail({
                token: session.token,
                developmentId: development.id,
              }),
            staleTime: 60_000,
          }))
        : [],
  });

  const relatedDevelopments = useMemo<BuyerDevelopmentRelationship[]>(() => {
    if (!currentBuyer) {
      return [];
    }

    return crossDevelopmentQueries
      .map((query) => query.data)
      .filter((item): item is DevelopmentDetailResult => Boolean(item))
      .map((detail) => {
        const matchedBuyer = findMatchingBuyer(detail.buyers, currentBuyer, buyerId ?? "");
        if (!matchedBuyer) {
          return null;
        }

        const relatedProcesses = detail.processes.filter(
          (process) =>
            process.buyerId === matchedBuyer.id ||
            process.buyerName?.trim().toLowerCase() === matchedBuyer.name.trim().toLowerCase(),
        );

        return {
          developmentId: detail.development.id,
          developmentName: detail.development.name,
          development: detail.development,
          buyer: matchedBuyer,
          processCount: relatedProcesses.length,
          pendingRequirements: relatedProcesses.reduce(
            (total, process) => total + process.pendingRequirements,
            0,
          ),
          currentStageLabel:
            relatedProcesses[0]?.currentStageName?.trim() ||
            (relatedProcesses[0] ? processStatusLabels[relatedProcesses[0].status] : "Certificado"),
          processes: relatedProcesses,
        };
      })
      .filter((item): item is BuyerDevelopmentRelationship => Boolean(item))
      .sort((left, right) => {
        if (left.developmentId === developmentId) {
          return -1;
        }

        if (right.developmentId === developmentId) {
          return 1;
        }

        return left.developmentName.localeCompare(right.developmentName);
      });
  }, [buyerId, crossDevelopmentQueries, currentBuyer, developmentId]);

  const aggregatedProcesses = useMemo(
    () =>
      relatedDevelopments.flatMap((relationship) =>
        relationship.processes.map((process) => ({
          ...process,
          developmentName: relationship.developmentName,
          unitLabel: relationship.buyer.unitLabel ?? process.propertyLabel,
        })),
      ),
    [relatedDevelopments],
  );

  const hasCrossDevelopmentError = crossDevelopmentQueries.some((query) => query.isError);
  const isCrossDevelopmentPending =
    developmentsQuery.isPending ||
    currentDevelopmentQuery.isPending ||
    crossDevelopmentQueries.some((query) => query.isPending);

  if (!parsedParams.success) {
    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="p-5">
          <p className="font-medium text-rose-700">Comprador inválido.</p>
        </CardContent>
      </Card>
    );
  }

  if (isCrossDevelopmentPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (currentDevelopmentQuery.isError || developmentsQuery.isError || hasCrossDevelopmentError || !currentBuyer) {
    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="space-y-3 p-5">
          <p className="font-medium text-rose-700">
            {getApiErrorMessage(
              currentDevelopmentQuery.error ?? developmentsQuery.error,
              "Não foi possível carregar o detalhe do comprador.",
            )}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(routes.developmentDetailById(parsedParams.data.developmentId))}
          >
            Voltar para o empreendimento
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalPendingRequirements = aggregatedProcesses.reduce(
    (total, process) => total + process.pendingRequirements,
    0,
  );
  const editingRelationship =
    relatedDevelopments.find((relationship) => relationship.developmentId === editingRelationshipId) ??
    null;

  return (
    <section className="space-y-6">
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{currentBuyer.name}</CardTitle>
              <CardDescription>
                Perfil consolidado do comprador dentro da carteira do supplier. A pessoa pode estar
                vinculada a mais de um empreendimento.
              </CardDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="icon" aria-label="Abrir acoes do comprador">
                  <MenuIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-xl">
                <DropdownMenuItem
                  className="rounded-xl px-3 py-2"
                  onClick={() => {
                    setDrawerMessage(null);
                    setBuyerEditOpen(true);
                  }}
                >
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="rounded-xl px-3 py-2 text-rose-600">
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">CPF</p>
              <p className="mt-2 font-medium text-foreground">{currentBuyer.cpf || "-"}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">E-mail</p>
              <p className="mt-2 font-medium text-foreground">{currentBuyer.email || "-"}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Telefone</p>
              <p className="mt-2 font-medium text-foreground">{currentBuyer.phone || "-"}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Empreendimentos vinculados
              </p>
              <p className="mt-2 font-medium text-foreground">{relatedDevelopments.length}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Processos vinculados</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{aggregatedProcesses.length}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Pendências abertas</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{totalPendingRequirements}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            As ações de editar e excluir ainda não estão conectadas no portal supplier, porque o
            contrato atual expõe apenas criação de comprador nesta área.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Empreendimentos vinculados</CardTitle>
          <CardDescription>
            Lista consolidada dos empreendimentos do supplier em que este comprador aparece.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {relatedDevelopments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Nenhum outro empreendimento foi encontrado para este comprador.
            </div>
          ) : (
            <div className="grid gap-4">
              {relatedDevelopments.map((relationship) => (
                <article
                  key={`${relationship.developmentId}-${relationship.buyer.id}`}
                  className="rounded-2xl border border-border/70 bg-background/80 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-foreground">
                        {relationship.developmentName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Unidade: {relationship.buyer.unitLabel ?? "Nao informada"}
                      </p>
                    </div>
                    {relationship.developmentId === developmentId ? (
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        Em processo
                      </span>
                    ) : null}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Abrir acoes do empreendimento ${relationship.developmentName}`}
                        >
                          <MenuIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl">
                        <DropdownMenuItem
                          className="rounded-xl px-3 py-2"
                          onClick={() => {
                            setDrawerMessage(null);
                            setEditingRelationshipId(relationship.developmentId);
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-5">
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Etapa atual
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {relationship.currentStageLabel}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Status do processo
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        Aguardando informações
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Processos
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {relationship.processCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Pendências
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {relationship.pendingRequirements}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Valor da compra
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {relationship.buyer.purchaseValue
                          ? formatBuyerPurchaseValue(relationship.buyer.purchaseValue)
                          : "Não disponível"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to={routes.developmentDetailById(relationship.developmentId)}
                      className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      Abrir empreendimento
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        navigate(
                          routes.developmentBuyerDetailById(
                            relationship.developmentId,
                            relationship.buyer.id,
                          ),
                        )
                      }
                    >
                      Ver processo
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Processos relacionados</CardTitle>
          <CardDescription>
            Visão cruzada dos processos deste comprador em todos os empreendimentos encontrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aggregatedProcesses.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Nenhum processo foi localizado para este comprador.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empreendimento</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Etapa atual</TableHead>
                    <TableHead>Pendências</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregatedProcesses.map((process) => (
                    <TableRow key={`${process.developmentId}-${process.id}`}>
                      <TableCell className="font-medium">{process.developmentName ?? "-"}</TableCell>
                      <TableCell>{process.unitLabel ?? process.propertyLabel}</TableCell>
                      <TableCell>{process.workflowName ?? "-"}</TableCell>
                      <TableCell>{process.currentStageName ?? "-"}</TableCell>
                      <TableCell>{process.pendingRequirements}</TableCell>
                      <TableCell>{processStatusLabels[process.status]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={isBuyerEditOpen}
        onOpenChange={(open) => {
          setBuyerEditOpen(open);
          if (!open) {
            setDrawerMessage(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>Editar comprador</SheetTitle>
              <SheetDescription>
                Ajuste apenas os dados cadastrais da pessoa. Informações de vínculo com
                empreendimento ficam em outro drawer.
              </SheetDescription>
            </SheetHeader>

            {drawerMessage ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {drawerMessage}
              </div>
            ) : null}

            <BuyerForm
              initialValues={buildBuyerFormInitialValues(currentBuyer)}
              showPurchaseSection={false}
              isSubmitting={false}
              submitLabel="Salvar alterações"
              cancelLabel="Cancelar"
              basicSectionTitle="Dados cadastrais do comprador"
              basicSectionDescription="Nome, contato e informações pessoais básicas."
              onCancel={() => {
                setBuyerEditOpen(false);
                setDrawerMessage(null);
              }}
              onSubmit={async () => {
                setDrawerMessage(
                  "Edição de dados cadastrais ainda não conectada ao backend do portal supplier.",
                );
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={Boolean(editingRelationship)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRelationshipId(null);
            setDrawerMessage(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
          {editingRelationship ? (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>Editar vínculo com empreendimento</SheetTitle>
                <SheetDescription>
                  Informações do comprador específicas do empreendimento{" "}
                  {editingRelationship.developmentName}.
                </SheetDescription>
              </SheetHeader>

              {drawerMessage ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  {drawerMessage}
                </div>
              ) : null}

              <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardHeader>
                  <CardTitle>Dados do empreendimento</CardTitle>
                  <CardDescription>
                    Informações cadastrais do empreendimento e dados deste comprador dentro desse contexto.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Nome</p>
                      <p className="mt-2 font-medium text-foreground">
                        {editingRelationship.development.name}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Tipo</p>
                      <p className="mt-2 font-medium text-foreground">
                        {developmentTypeLabels[editingRelationship.development.developmentType]}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Status</p>
                      <p className="mt-2 font-medium text-foreground">
                        {developmentStatusLabels[editingRelationship.development.status]}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">CEP</p>
                      <p className="mt-2 font-medium text-foreground">
                        {editingRelationship.development.postalCode || "Não disponível"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/80 p-4 md:col-span-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Endereço</p>
                      <p className="mt-2 font-medium text-foreground">
                        {buildDevelopmentAddress(editingRelationship.development)}
                      </p>
                    </div>
                  </div>

                  <BuyerForm
                    initialValues={buildBuyerFormInitialValues(editingRelationship.buyer)}
                    availableItems={relationshipAvailabilityQuery.data?.items ?? []}
                    showBasicSection={false}
                    showPurchaseSection
                    wrapPurchaseSectionInCard={false}
                    purchaseFieldsClassName="grid gap-4 md:grid-cols-2"
                    isSubmitting={false}
                    submitLabel="Salvar alterações"
                    cancelLabel="Cancelar"
                    purchaseSectionTitle=""
                    purchaseSectionDescription=""
                    onCancel={() => {
                      setEditingRelationshipId(null);
                      setDrawerMessage(null);
                    }}
                    onSubmit={async () => {
                      setDrawerMessage(
                        "Edição do vínculo do comprador com o empreendimento ainda não conectada ao backend do portal supplier.",
                      );
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

    </section>
  );
}
