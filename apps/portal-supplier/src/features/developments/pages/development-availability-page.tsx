import { zodResolver } from "@hookform/resolvers/zod";
import {
  availabilityStatusLabels,
  availabilityStructureTypeLabels,
  generateAvailabilityInputSchema,
  type AvailabilityStructureType,
  type DevelopmentRegistrationType,
  type GenerateAvailabilityInput,
} from "@registra/shared";
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
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@registra/ui";
import { useDeferredValue, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import {
  useDeleteAvailabilityItemMutation,
  useDevelopmentAvailabilityQuery,
  useGenerateDevelopmentAvailabilityMutation,
  useUpdateAvailabilityItemMutation,
} from "@/features/developments/hooks/use-development-availability-queries";
import { useDevelopmentDetailQuery } from "@/features/developments/hooks/use-development-queries";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { routes } from "@/shared/constants/routes";

const developmentIdParamSchema = z.string().trim().min(1);
const generateAvailabilityPrefixSchema = z.object({
  prefix: z.string().trim().max(24).optional(),
});

type GenerateAvailabilityPrefixFormInput = z.input<typeof generateAvailabilityPrefixSchema>;
type GenerateAvailabilityPrefixFormValues = z.output<typeof generateAvailabilityPrefixSchema>;

function AvailabilitySummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-rose-600">{message}</p>;
}

function inferAvailabilityStructureType(input: {
  developmentType: DevelopmentRegistrationType;
  totalTowers: number;
}): AvailabilityStructureType {
  if (input.developmentType === "land_subdivision") {
    return "block_lot";
  }

  if (input.totalTowers > 1) {
    return "tower_unit";
  }

  return "simple";
}

function buildAutomaticGenerationInput(input: {
  developmentType: DevelopmentRegistrationType;
  totalUnits: number;
  totalTowers: number;
  prefix?: string;
}): GenerateAvailabilityInput {
  const structureType = inferAvailabilityStructureType({
    developmentType: input.developmentType,
    totalTowers: input.totalTowers,
  });
  const totalUnits = Math.max(1, input.totalUnits);
  const totalTowers = Math.max(1, input.totalTowers);
  const prefix = input.prefix?.trim() ? input.prefix.trim() : undefined;

  if (structureType === "block_lot") {
    return generateAvailabilityInputSchema.parse({
      structureType,
      prefix,
      totalBlocks: totalTowers,
      lotsPerBlock: Math.max(1, Math.ceil(totalUnits / totalTowers)),
    });
  }

  if (structureType === "tower_unit") {
    return generateAvailabilityInputSchema.parse({
      structureType,
      prefix,
      totalTowers,
      unitsPerTower: Math.max(1, Math.ceil(totalUnits / totalTowers)),
    });
  }

  return generateAvailabilityInputSchema.parse({
    structureType,
    prefix,
    totalUnits,
  });
}

export function DevelopmentAvailabilityPage() {
  const navigate = useNavigate();
  const params = useParams<{ developmentId: string }>();
  const [search, setSearch] = useState("");
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    displayLabel: string;
  } | null>(null);
  const deferredSearch = useDeferredValue(search);
  const developmentId = useMemo(() => {
    const parsed = developmentIdParamSchema.safeParse(params.developmentId);
    return parsed.success ? parsed.data : null;
  }, [params.developmentId]);
  const developmentQuery = useDevelopmentDetailQuery(developmentId);
  const availabilityQuery = useDevelopmentAvailabilityQuery(developmentId, deferredSearch);
  const generateMutation = useGenerateDevelopmentAvailabilityMutation(developmentId ?? "");
  const updateItemMutation = useUpdateAvailabilityItemMutation(developmentId ?? "");
  const deleteItemMutation = useDeleteAvailabilityItemMutation(developmentId ?? "");
  const generatorForm = useForm<GenerateAvailabilityPrefixFormInput, undefined, GenerateAvailabilityPrefixFormValues>({
    resolver: zodResolver(generateAvailabilityPrefixSchema),
    defaultValues: {
      prefix: "",
    },
  });
  const buyersById = useMemo(
    () => new Map((developmentQuery.data?.buyers ?? []).map((buyer) => [buyer.id, buyer.name])),
    [developmentQuery.data?.buyers],
  );

  if (!developmentId) {
    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="p-5">
          <p className="font-medium text-rose-700">Empreendimento inválido para gerenciar disponibilidade.</p>
        </CardContent>
      </Card>
    );
  }

  if (developmentQuery.isPending || availabilityQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (developmentQuery.isError || availabilityQuery.isError) {
    const error = developmentQuery.error ?? availabilityQuery.error;

    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="space-y-3 p-5">
          <p className="font-medium text-rose-700">
            {getApiErrorMessage(error, "Não foi possível carregar a disponibilidade do empreendimento.")}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              void developmentQuery.refetch();
              void availabilityQuery.refetch();
            }}
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const detail = developmentQuery.data;
  const availability = availabilityQuery.data;
  const mutationError = generateMutation.error ?? updateItemMutation.error ?? deleteItemMutation.error ?? null;

  if (!detail || !availability) {
    return null;
  }

  const automaticGenerationInput = buildAutomaticGenerationInput({
    developmentType: detail.development.developmentType,
    totalUnits: detail.development.totalUnits,
    totalTowers: detail.development.totalTowers,
    prefix: generatorForm.watch("prefix"),
  });
  const automaticGenerationDetails =
    automaticGenerationInput.structureType === "tower_unit"
      ? `${automaticGenerationInput.totalTowers} torres com ${automaticGenerationInput.unitsPerTower} unidades por torre.`
      : automaticGenerationInput.structureType === "block_lot"
        ? `${automaticGenerationInput.totalBlocks} quadras com ${automaticGenerationInput.lotsPerBlock} lotes por quadra.`
        : `${automaticGenerationInput.totalUnits} unidades simples.`;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold">Disponibilidade da volumetria</h2>
        <p className="text-sm text-muted-foreground">
          Gestão da volumetria do empreendimento {detail.development.name} integrada à API.
        </p>
      </header>

      {mutationError ? (
        <Card className="border-rose-200 bg-rose-50/80">
          <CardContent className="p-5 text-sm text-rose-700">
            {getApiErrorMessage(mutationError, "Não foi possível salvar a disponibilidade.")}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AvailabilitySummaryCard label="Total" value={availability.summary.total} />
        <AvailabilitySummaryCard label="Disponíveis" value={availability.summary.available} />
        <AvailabilitySummaryCard label="Reservadas" value={availability.summary.reserved} />
        <AvailabilitySummaryCard label="Vendidas" value={availability.summary.sold} />
        <AvailabilitySummaryCard label="Bloqueadas" value={availability.summary.blocked} />
      </div>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Gerar volumetria</CardTitle>
          <CardDescription>
            A geração usa automaticamente os totais já cadastrados no empreendimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={generatorForm.handleSubmit(async ({ prefix }) => {
              await generateMutation.mutateAsync(
                buildAutomaticGenerationInput({
                  developmentType: detail.development.developmentType,
                  totalUnits: detail.development.totalUnits,
                  totalTowers: detail.development.totalTowers,
                  prefix,
                }),
              );
            })}
          >
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="prefix" className="text-sm font-medium">
                Prefixo opcional
              </label>
              <Input id="prefix" {...generatorForm.register("prefix")} placeholder="Ex.: Residencial Vista" />
              <FieldError message={generatorForm.formState.errors.prefix?.message} />
            </div>

            <div className="rounded-xl border p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Configuração automática</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Estrutura</p>
                  <p className="font-medium">
                    {availabilityStructureTypeLabels[automaticGenerationInput.structureType]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total cadastrado</p>
                  <p className="font-medium">{detail.development.totalUnits} itens</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Distribuição</p>
                  <p className="font-medium">{automaticGenerationDetails}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={generateMutation.isPending}>
                Gerar base inicial
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Lista de disponibilidade</CardTitle>
            <CardDescription>
              Controle operacional de ocupação e bloqueio da volumetria.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Buscar unidade ou lote"
              aria-label="Buscar unidade ou lote"
            />
            <Button type="button" variant="outline" onClick={() => navigate(routes.developmentDetailById(developmentId))}>
              Voltar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {availability.items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Nenhum item encontrado para este empreendimento.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availability.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.displayLabel}</TableCell>
                      <TableCell>{availabilityStatusLabels[item.status]}</TableCell>
                      <TableCell>
                        {item.linkedBuyerName ??
                          (item.buyerId ? buyersById.get(item.buyerId) ?? `Comprador ${item.buyerId}` : "-")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-xl"
                              aria-label={`Ações de ${item.displayLabel}`}
                            >
                              <span aria-hidden="true" className="text-base leading-none">
                                ...
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl">
                            <DropdownMenuItem
                              disabled={updateItemMutation.isPending || item.status === "available"}
                              onClick={() =>
                                void updateItemMutation.mutateAsync({
                                  itemId: item.id,
                                  input: {
                                    status: "available",
                                    blockedReason: null,
                                  },
                                })
                              }
                            >
                              Liberar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={updateItemMutation.isPending || item.status === "blocked"}
                              onClick={() =>
                                void updateItemMutation.mutateAsync({
                                  itemId: item.id,
                                  input: {
                                    status: "blocked",
                                    blockedReason: "Bloqueio manual no portal supplier.",
                                  },
                                })
                              }
                            >
                              Bloquear
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-rose-600 focus:text-rose-600"
                              disabled={
                                deleteItemMutation.isPending ||
                                Boolean(item.buyerId) ||
                                Boolean(item.processId) ||
                                item.status === "reserved" ||
                                item.status === "sold"
                              }
                              onClick={() =>
                                setItemToDelete({
                                  id: item.id,
                                  displayLabel: item.displayLabel,
                                })
                              }
                            >
                              Deletar
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

      <AlertDialog open={Boolean(itemToDelete)} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item de disponibilidade?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete ? (
                <>
                  Tem certeza que deseja excluir <strong>{itemToDelete.displayLabel}</strong>? Esta ação não poderá ser
                  desfeita.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteItemMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500"
              disabled={deleteItemMutation.isPending || !itemToDelete}
              onClick={() => {
                if (!itemToDelete) {
                  return;
                }

                deleteItemMutation.mutate(itemToDelete.id, {
                  onSuccess: () => {
                    setItemToDelete(null);
                  },
                });
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
