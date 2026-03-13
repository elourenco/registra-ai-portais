import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@registra/ui";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import {
  buildDevelopmentAddress,
  buyerStatusLabels,
  developmentStatusLabels,
  developmentTypeLabels,
  processStatusLabels,
} from "@/features/developments/core/developments-schema";
import { buildUpdatePayloadFromDetail } from "@/features/developments/api/developments-api";
import {
  useDeleteDevelopmentMutation,
  useDevelopmentDetailQuery,
  useUpdateDevelopmentMutation,
} from "@/features/developments/hooks/use-development-queries";
import { routes } from "@/shared/constants/routes";
import { getApiErrorMessage } from "@/shared/api/http-client";

const developmentIdParamSchema = z.string().trim().min(1);

type DetailTab = "processes" | "buyers" | "details";

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {label}
    </button>
  );
}

export function DevelopmentDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ developmentId: string }>();
  const [activeTab, setActiveTab] = useState<DetailTab>("processes");
  const [searchBuyers, setSearchBuyers] = useState("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
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

  const detailFormDefaults = useMemo<Record<string, string> | null>(() => {
    if (!detail) {
      return null;
    }

    const values = buildUpdatePayloadFromDetail(detail.development);

    return {
      name: values.name,
      developmentType: values.developmentType,
      speCnpj: values.speCnpj,
      legalName: values.legalName,
      tradeName: values.tradeName ?? "",
      incorporationRegistrationNumber: values.incorporationRegistrationNumber,
      incorporationRegistrationDate: values.incorporationRegistrationDate,
      masterRegistrationNumber: values.masterRegistrationNumber,
      postalCode: values.postalCode,
      address: values.address,
      number: values.number,
      complement: values.complement ?? "",
      neighborhood: values.neighborhood,
      city: values.city,
      state: values.state,
      registryOfficeName: values.registryOfficeName,
      registryOfficeNumber: values.registryOfficeNumber,
      registryOfficeCity: values.registryOfficeCity,
      registryOfficeState: values.registryOfficeState,
      totalUnits: String(values.totalUnits),
      totalTowers: String(values.totalTowers),
      parkingSpots: String(values.parkingSpots ?? 0),
      status: values.status,
    };
  }, [detail]);

  const mergedFormValues = detailFormDefaults ? { ...detailFormDefaults, ...formValues } : null;
  const isDirty =
    detailFormDefaults && mergedFormValues
      ? Object.entries(detailFormDefaults).some(([key, value]) => mergedFormValues[key] !== value)
      : false;
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

  if (!detail || !mergedFormValues) {
    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="p-5">
          <p className="font-medium text-rose-700">Empreendimento não encontrado.</p>
        </CardContent>
      </Card>
    );
  }

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
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => navigate(routes.developmentBuyerCreateById(detail.development.id))}>
                Cadastrar compradores
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(routes.developments)}>
                Voltar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">CNPJ</p>
            <p className="mt-2 font-medium">{detail.development.speCnpj}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Tipo</p>
            <p className="mt-2 font-medium">{developmentTypeLabels[detail.development.developmentType]}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Status</p>
            <p className="mt-2 font-medium">{developmentStatusLabels[detail.development.status]}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Processos</p>
            <p className="mt-2 font-medium">{detail.processes.length}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <TabButton active={activeTab === "processes"} label="Processos" onClick={() => setActiveTab("processes")} />
        <TabButton active={activeTab === "buyers"} label="Compradores" onClick={() => setActiveTab("buyers")} />
        <TabButton active={activeTab === "details"} label="Detalhes" onClick={() => setActiveTab("details")} />
      </div>

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
                    <TableRow>
                      <TableHead>Processo</TableHead>
                      <TableHead>Comprador</TableHead>
                      <TableHead>Workflow</TableHead>
                      <TableHead>Etapa atual</TableHead>
                      <TableHead>Pendências</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.processes.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{item.propertyLabel}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.registrationNumber ? `Matrícula ${item.registrationNumber}` : `Processo #${item.id}`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{item.buyerName ?? "-"}</TableCell>
                        <TableCell>{item.workflowName ?? "-"}</TableCell>
                        <TableCell>{item.currentStageName ?? "-"}</TableCell>
                        <TableCell>{item.pendingRequirements}</TableCell>
                        <TableCell>{processStatusLabels[item.status]}</TableCell>
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
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buyers.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.cpf || "-"}</TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.phone || "-"}</TableCell>
                        <TableCell>{buyerStatusLabels[item.status]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "details" ? (
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Detalhes do empreendimento</CardTitle>
            <CardDescription>
              Edição conectada ao contrato documentado da API. Exclusão segue bloqueada quando há processos vinculados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {apiGapMessage ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {apiGapMessage}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(mergedFormValues).map(([key, value]) => (
                <label key={key} className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">{key}</span>
                  <Input
                    value={value}
                    onChange={(event) => {
                      setApiGapMessage(null);
                      setFormValues((current) => ({ ...current, [key]: event.currentTarget.value }));
                    }}
                  />
                </label>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={!canDelete || deleteDevelopmentMutation.isPending}
                onClick={async () => {
                  setApiGapMessage(null);
                  setSuccessMessage(null);

                  if (!canDelete) {
                    return;
                  }

                  try {
                    await deleteDevelopmentMutation.mutateAsync();
                    navigate(routes.developments);
                  } catch (error) {
                    setApiGapMessage(
                      getApiErrorMessage(
                        error,
                        "Não foi possível excluir o empreendimento.",
                      ),
                    );
                  }
                }}
              >
                Deletar
              </Button>
              <Button
                type="button"
                disabled={!isDirty || updateDevelopmentMutation.isPending}
                onClick={async () => {
                  setApiGapMessage(null);
                  setSuccessMessage(null);

                  try {
                    await updateDevelopmentMutation.mutateAsync({
                      ...buildUpdatePayloadFromDetail(detail.development),
                      ...mergedFormValues,
                      totalUnits: Number(mergedFormValues.totalUnits),
                      totalTowers: Number(mergedFormValues.totalTowers),
                      parkingSpots: Number(mergedFormValues.parkingSpots),
                    });
                    setFormValues({});
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
              >
                Salvar
              </Button>
            </div>

            {successMessage ? (
              <p className="text-sm text-emerald-700">{successMessage}</p>
            ) : null}

            {!canDelete ? (
              <p className="text-xs text-muted-foreground">
                O botão de deletar só pode ser usado quando não houver processo vinculado.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
