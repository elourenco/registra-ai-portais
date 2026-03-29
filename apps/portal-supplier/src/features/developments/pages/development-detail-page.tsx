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
  developmentTypeLabels,
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

export function DevelopmentDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ developmentId: string }>();
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
        process.currentStageName?.trim() || "Em andamento",
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
      ? `${operationalAvailableUnits}/${detail.development.totalUnits}`
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
              </div>
              <div className="mt-6 grid gap-5 border-t border-border/60 pt-5 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Compradores
                    </p>
                    <div className="flex items-end gap-3">
                      <p className="text-3xl font-semibold text-foreground">
                        {operationalSnapshot.activeBuyers}
                      </p>
                      <p className="pb-1 text-sm text-muted-foreground">ativos</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {operationalSnapshot.pendingBuyers} comprador(es) ainda pendentes na carteira deste empreendimento.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Volumetria e estoque
                    </p>
                    <div className="flex items-end gap-3">
                      <p className="text-3xl font-semibold text-foreground">{volumetryCoverageLabel}</p>
                      <p className="pb-1 text-sm text-muted-foreground">livres / total</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {availabilityQuery.data
                      ? `${operationalAvailableUnits} unidade(s) livres e ${operationalSnapshot.availabilitySold} vendida(s).`
                      : `${operationalCommittedUnits} unidade(s) comprometidas pela operação atual.`}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="flex min-h-32 flex-col justify-center rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">CNPJ</p>
                <p className="mt-2 font-medium text-foreground">{detail.development.speCnpj}</p>
              </div>
              <div className="flex min-h-32 flex-col justify-center rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Tipo</p>
                <p className="mt-2 font-medium text-foreground">
                  {developmentTypeLabels[detail.development.developmentType]}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {successMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buyers.map((item) => (
                    <TableRow
                      key={item.id}
                      role="link"
                      tabIndex={0}
                      className="cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40"
                      onClick={() =>
                        navigate(routes.developmentBuyerDetailById(detail.development.id, item.id))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(routes.developmentBuyerDetailById(detail.development.id, item.id));
                        }
                      }}
                    >
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.cpf || "-"}</TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>{item.phone || "-"}</TableCell>
                      <TableCell>{item.unitLabel ?? "-"}</TableCell>
                      <TableCell>{buyerStageById.get(item.id) ?? "Certificado"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
