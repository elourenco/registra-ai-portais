import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
  Input,
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
  TrashIcon,
} from "@registra/ui";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { DevelopmentForm } from "@/features/developments/components/development-form";
import {
  buildDevelopmentAddress,
  developmentStatusLabels,
  developmentTypeLabels,
  processStatusLabels,
} from "@/features/developments/core/developments-schema";
import { buildUpdatePayloadFromDetail } from "@/features/developments/api/developments-api";
import type { SupplierDevelopmentCreateFormInput } from "@/features/developments/core/development-create-schema";
import { useDevelopmentAvailabilityQuery } from "@/features/developments/hooks/use-development-availability-queries";
import {
  useDeleteDevelopmentMutation,
  useDevelopmentDetailQuery,
  useUpdateDevelopmentMutation,
} from "@/features/developments/hooks/use-development-queries";
import { routes } from "@/shared/constants/routes";
import { getApiErrorMessage } from "@/shared/api/http-client";

const developmentIdParamSchema = z.string().trim().min(1);

type DetailTab = "processes" | "buyers";

function formatProcessUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function DevelopmentDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ developmentId: string }>();
  const [activeTab, setActiveTab] = useState<DetailTab>("processes");
  const [isEditSheetOpen, setEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchBuyers, setSearchBuyers] = useState("");
  const [apiGapMessage, setApiGapMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const developmentId = useMemo(() => {
    const parsed = developmentIdParamSchema.safeParse(params.developmentId);
    return parsed.success ? parsed.data : null;
  }, [params.developmentId]);
  const developmentQuery = useDevelopmentDetailQuery(developmentId);
  const updateDevelopmentMutation = useUpdateDevelopmentMutation(developmentId ?? "");
  const deleteDevelopmentMutation = useDeleteDevelopmentMutation(developmentId ?? "");

  const detail = developmentQuery.data;
  const availabilityQuery = useDevelopmentAvailabilityQuery(developmentId);
  const buyers = useMemo(() => {
    const items = detail?.buyers ?? [];
    const search = searchBuyers.trim().toLowerCase();
    if (!search) {
      return items;
    }

    return items.filter((item) =>
      [item.name, item.email, item.cpf].some((value) => value.toLowerCase().includes(search)),
    );
  }, [detail?.buyers, searchBuyers]);
  const buyerStageById = useMemo(() => {
    const map = new Map<string, string>();

    for (const process of detail?.processes ?? []) {
      if (!process.buyerId) {
        continue;
      }

      map.set(
        process.buyerId,
        process.currentStageName?.trim() || processStatusLabels[process.status],
      );
    }

    return map;
  }, [detail?.processes]);

  const editFormInitialValues = useMemo<Partial<SupplierDevelopmentCreateFormInput> | null>(() => {
    if (!detail) {
      return null;
    }

    return {
      legalName: detail.development.legalName,
      tradeName: detail.development.tradeName,
      speCnpj: detail.development.speCnpj,
      name: detail.development.name,
      postalCode: detail.development.postalCode,
      address: detail.development.address,
      number: detail.development.number,
      complement: detail.development.complement,
      neighborhood: detail.development.neighborhood,
      city: detail.development.city,
      state: detail.development.state as SupplierDevelopmentCreateFormInput["state"],
      totalTowers: detail.development.totalTowers,
      totalUnits: detail.development.totalUnits,
      unitsPerFloor: undefined,
      totalFloors: undefined,
      totalBlocks: undefined,
      totalLots: undefined,
      largerAreaContributorNote: "",
      developmentType:
        detail.development.developmentType === "land_subdivision"
          ? "loteamento"
          : "incorporacao_vertical",
      developmentModality: "sbpe",
    };
  }, [detail]);
  const canDelete = Boolean(detail && detail.processes.length === 0);

  if (!developmentId) {
    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="p-5">
          <p className="font-medium text-rose-700">Empreendimento inválido.</p>
        </CardContent>
      </Card>
    );
  }

  if (developmentQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (developmentQuery.isError) {
    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="space-y-3 p-5">
          <p className="font-medium text-rose-700">
            {getApiErrorMessage(developmentQuery.error, "Não foi possível carregar o detalhe do empreendimento.")}
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={() => developmentQuery.refetch()}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!detail || !editFormInitialValues) {
    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="p-5">
          <p className="font-medium text-rose-700">Empreendimento não encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  const operationalSnapshot = {
    totalProcesses: detail.processes.length,
    activeProcesses: detail.processes.filter((item) =>
      ["in_progress", "waiting_supplier", "waiting_registry_office", "requirement_open", "overdue"].includes(item.status),
    ).length,
    overdueProcesses: detail.processes.filter((item) => item.status === "overdue").length,
    waitingSupplier: detail.processes.filter((item) => item.status === "waiting_supplier").length,
    waitingRegistryOffice: detail.processes.filter((item) => item.status === "waiting_registry_office").length,
    completedProcesses: detail.processes.filter((item) => item.status === "completed").length,
    pendingRequirements: detail.processes.reduce((total, item) => total + item.pendingRequirements, 0),
    activeBuyers: detail.buyers.filter((item) => item.status === "active").length,
    pendingBuyers: detail.buyers.filter((item) => item.status === "pending").length,
    availabilityTotal: availabilityQuery.data?.summary.total ?? 0,
    availabilityAvailable: availabilityQuery.data?.summary.available ?? 0,
    availabilityReserved: availabilityQuery.data?.summary.reserved ?? 0,
    availabilitySold: availabilityQuery.data?.summary.sold ?? 0,
  };
  const operationalCommittedUnits = Math.max(
    operationalSnapshot.activeProcesses,
    operationalSnapshot.availabilityReserved + operationalSnapshot.availabilitySold,
  );
  const operationalAvailableUnits = availabilityQuery.data
    ? Math.max(
        0,
        Math.min(
          operationalSnapshot.availabilityAvailable,
          detail.development.totalUnits - operationalCommittedUnits,
        ),
      )
    : Math.max(0, detail.development.totalUnits - operationalCommittedUnits);
  const volumetryCoverageLabel =
    operationalSnapshot.availabilityTotal > 0
      ? `${operationalSnapshot.availabilityTotal}/${detail.development.totalUnits}`
      : `0/${detail.development.totalUnits}`;
  const primaryOperationMessage =
    operationalSnapshot.overdueProcesses > 0
      ? `${operationalSnapshot.overdueProcesses} processo(s) em atraso exigem atuacao imediata.`
      : operationalSnapshot.pendingRequirements > 0
        ? `${operationalSnapshot.pendingRequirements} pendencia(s) abertas no conjunto do empreendimento.`
        : operationalSnapshot.activeProcesses > 0
          ? `${operationalSnapshot.activeProcesses} processo(s) seguem ativos na esteira operacional.`
          : "Operacao sem pendencias criticas neste momento.";
  const secondaryOperationMessage =
    operationalSnapshot.waitingSupplier > 0
      ? `${operationalSnapshot.waitingSupplier} processo(s) aguardando retorno do supplier.`
      : operationalSnapshot.waitingRegistryOffice > 0
        ? `${operationalSnapshot.waitingRegistryOffice} processo(s) aguardando cartorio.`
        : operationalSnapshot.completedProcesses > 0
          ? `${operationalSnapshot.completedProcesses} processo(s) ja foram concluidos.`
          : "Ainda nao ha processos concluidos para este empreendimento.";

  return (
    <section className="space-y-6">
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{detail.development.name}</CardTitle>
              <CardDescription>
                {detail.supplier?.name ?? "Supplier não identificado"} · {buildDevelopmentAddress(detail.development)}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(routes.developmentAvailabilityById(detail.development.id))}
              >
                Gerenciar disponibilidade
              </Button>
              <Button type="button" onClick={() => navigate(routes.developmentBuyerCreateById(detail.development.id))}>
                Cadastrar compradores
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon" aria-label="Abrir acoes do empreendimento">
                    <MenuIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  <DropdownMenuItem
                    className="gap-2 rounded-xl px-3 py-2"
                    onClick={() => {
                      setApiGapMessage(null);
                      setSuccessMessage(null);
                      setEditSheetOpen(true);
                    }}
                  >
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 rounded-xl px-3 py-2 text-rose-600 focus:text-rose-700"
                    disabled={!canDelete}
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Panorama operacional
                  </p>
                  <p className="text-lg font-semibold text-foreground">{primaryOperationMessage}</p>
                  <p className="text-sm text-muted-foreground">{secondaryOperationMessage}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Status do empreendimento
                  </p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {developmentStatusLabels[detail.development.status]}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">CNPJ</p>
                <p className="mt-2 font-medium text-foreground">{detail.development.speCnpj}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Tipo</p>
                <p className="mt-2 font-medium text-foreground">
                  {developmentTypeLabels[detail.development.developmentType]}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Processos ativos",
                value: String(operationalSnapshot.activeProcesses),
                helper: `${operationalSnapshot.totalProcesses} processo(s) no total`,
                toneClassName:
                  operationalSnapshot.activeProcesses > 0
                    ? "border-border/70 bg-background/80"
                    : "border-emerald-200 bg-emerald-50/80",
              },
              {
                label: "Pendências abertas",
                value: String(operationalSnapshot.pendingRequirements),
                helper: "Soma das exigências e itens pendentes nos processos",
                toneClassName:
                  operationalSnapshot.pendingRequirements > 0
                    ? "border-amber-200 bg-amber-50/80"
                    : "border-emerald-200 bg-emerald-50/80",
              },
              {
                label: "Em atraso",
                value: String(operationalSnapshot.overdueProcesses),
                helper: "Processos que já passaram do prazo operacional",
                toneClassName:
                  operationalSnapshot.overdueProcesses > 0
                    ? "border-rose-200 bg-rose-50/80"
                    : "border-emerald-200 bg-emerald-50/80",
              },
              {
                label: "Aguardando supplier",
                value: String(operationalSnapshot.waitingSupplier),
                helper: "Casos pendentes de retorno ou ação do supplier",
                toneClassName:
                  operationalSnapshot.waitingSupplier > 0
                    ? "border-amber-200 bg-amber-50/80"
                    : "border-border/70 bg-background/80",
              },
              {
                label: "Aguardando cartório",
                value: String(operationalSnapshot.waitingRegistryOffice),
                helper: "Itens parados em dependência externa de cartório",
                toneClassName:
                  operationalSnapshot.waitingRegistryOffice > 0
                    ? "border-amber-200 bg-amber-50/80"
                    : "border-border/70 bg-background/80",
              },
              {
                label: "Compradores ativos",
                value: String(operationalSnapshot.activeBuyers),
                helper: `${operationalSnapshot.pendingBuyers} comprador(es) ainda pendentes`,
                toneClassName: "border-border/70 bg-background/80",
              },
              {
                label: "Volumetria e estoque",
                value: volumetryCoverageLabel,
                helper: availabilityQuery.data
                  ? `${operationalAvailableUnits} livres, ${operationalSnapshot.availabilityReserved} reservadas, ${operationalSnapshot.availabilitySold} vendidas`
                  : `${operationalCommittedUnits} unidade(s) comprometidas pela operação atual`,
                toneClassName:
                  operationalSnapshot.availabilityTotal >= detail.development.totalUnits &&
                  detail.development.totalUnits > 0
                    ? "border-emerald-200 bg-emerald-50/80"
                    : "border-amber-200 bg-amber-50/80",
              },
            ].map((item) => (
              <Card key={item.label} className={`${item.toneClassName} shadow-none`}>
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">{item.value}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.helper}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {successMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <Card className="w-fit border-border/70 bg-card/95 shadow-sm">
        <CardContent className="flex gap-2 p-2">
          <Button
            variant={activeTab === "processes" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("processes")}
          >
            Processos
          </Button>
          <Button
            variant={activeTab === "buyers" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("buyers")}
          >
            Compradores
          </Button>
        </CardContent>
      </Card>

      {activeTab === "processes" ? (
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Processos do empreendimento</CardTitle>
            <CardDescription>Lista retornada no detalhe do empreendimento pela API.</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.processes.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Nenhum processo vinculado a este empreendimento.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow className="relative z-10 bg-card">
                      <TableHead className="relative z-10 bg-card">Processo</TableHead>
                      <TableHead className="relative z-10 bg-card">Comprador</TableHead>
                      <TableHead className="relative z-10 bg-card">Unidade</TableHead>
                      <TableHead className="relative z-10 bg-card">Etapa</TableHead>
                      <TableHead className="relative z-10 bg-card">Status</TableHead>
                      <TableHead className="relative z-10 bg-card">Pendências</TableHead>
                      <TableHead className="relative z-10 bg-card">Atualizado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.processes.map((item) => (
                      <TableRow
                        key={item.id}
                        role="link"
                        tabIndex={0}
                        className="relative z-0 cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40"
                        onClick={() =>
                          navigate(routes.developmentProcessDetailById(detail.development.id, item.id))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            navigate(routes.developmentProcessDetailById(detail.development.id, item.id));
                          }
                        }}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">#{item.id}</p>
                            {item.registrationNumber ? (
                              <p className="text-xs text-muted-foreground">Matrícula {item.registrationNumber}</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.buyerName ?? "-"}</TableCell>
                        <TableCell>{item.propertyLabel || "-"}</TableCell>
                        <TableCell>{item.currentStageName ?? "-"}</TableCell>
                        <TableCell>{processStatusLabels[item.status]}</TableCell>
                        <TableCell>{item.pendingRequirements}</TableCell>
                        <TableCell>{formatProcessUpdatedAt(item.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "buyers" ? (
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Compradores do empreendimento</CardTitle>
            <CardDescription>Lista filtrável do relacionamento supplier &gt; empreendimento &gt; compradores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={searchBuyers}
              onChange={(event) => setSearchBuyers(event.currentTarget.value)}
              placeholder="Buscar comprador por nome, e-mail ou CPF"
              aria-label="Buscar comprador"
            />

            {buyers.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Nenhum comprador encontrado para este empreendimento.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Comprador</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Etapa atual</TableHead>
                      <TableHead className="w-[80px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buyers.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.cpf || "-"}</TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.phone || "-"}</TableCell>
                        <TableCell>{item.unitLabel ?? "-"}</TableCell>
                        <TableCell>{buyerStageById.get(item.id) ?? "Certificado"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Abrir acoes do comprador ${item.name}`}
                              >
                                <MenuIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-xl">
                              <DropdownMenuItem disabled className="rounded-xl px-3 py-2">
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="rounded-xl px-3 py-2"
                                onClick={() =>
                                  navigate(
                                    routes.developmentBuyerDetailById(
                                      detail.development.id,
                                      item.id,
                                    ),
                                  )
                                }
                              >
                                Ver detalhe
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled className="rounded-xl px-3 py-2 text-rose-600">
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Sheet
        open={isEditSheetOpen}
        onOpenChange={(open) => {
          setEditSheetOpen(open);
          if (!open) {
            setApiGapMessage(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>Editar empreendimento</SheetTitle>
              <SheetDescription>
                Revise e atualize todas as informacoes cadastrais do empreendimento antes de salvar.
              </SheetDescription>
            </SheetHeader>

            {apiGapMessage ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {apiGapMessage}
              </div>
            ) : null}

            <DevelopmentForm
              submitLabel="Salvar"
              cancelLabel="Cancelar"
              isSubmitting={updateDevelopmentMutation.isPending}
              initialValues={editFormInitialValues}
              onCancel={() => {
                setEditSheetOpen(false);
                setApiGapMessage(null);
              }}
              onSubmit={async (values) => {
                setApiGapMessage(null);
                setSuccessMessage(null);

                try {
                  const basePayload = buildUpdatePayloadFromDetail(detail.development);

                  await updateDevelopmentMutation.mutateAsync({
                    ...basePayload,
                    name: values.name,
                    speCnpj: values.speCnpj,
                    legalName: values.legalName,
                    tradeName: values.tradeName,
                    postalCode: values.postalCode,
                    address: values.address,
                    number: values.number,
                    complement: values.complement ?? "",
                    neighborhood: values.neighborhood,
                    city: values.city,
                    state: values.state,
                    totalUnits: values.totalUnits ?? detail.development.totalUnits,
                    totalTowers: values.totalTowers ?? detail.development.totalTowers,
                    parkingSpots: detail.development.parkingSpots,
                    developmentType:
                      values.developmentType === "loteamento" ||
                      values.developmentType === "condominio_lotes"
                        ? "land_subdivision"
                        : detail.development.developmentType,
                  });
                  setEditSheetOpen(false);
                  setSuccessMessage("Empreendimento atualizado com sucesso.");
                  await developmentQuery.refetch();
                } catch (error) {
                  setApiGapMessage(
                    getApiErrorMessage(
                      error,
                      "Não foi possível salvar o empreendimento.",
                    ),
                  );
                }
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empreendimento?</AlertDialogTitle>
            <AlertDialogDescription>
              {canDelete
                ? "Essa acao remove o empreendimento permanentemente. Verifique se nao ha mais uso operacional antes de continuar."
                : "Este empreendimento possui processos vinculados e nao pode ser excluido no momento."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDevelopmentMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!canDelete || deleteDevelopmentMutation.isPending}
              onClick={async (event) => {
                event.preventDefault();
                setApiGapMessage(null);
                setSuccessMessage(null);

                if (!canDelete) {
                  return;
                }

                try {
                  await deleteDevelopmentMutation.mutateAsync();
                  navigate(routes.developments);
                } catch (error) {
                  setDeleteDialogOpen(false);
                  setApiGapMessage(
                    getApiErrorMessage(
                      error,
                      "Não foi possível excluir o empreendimento.",
                    ),
                  );
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
