import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  GitBranchIcon,
  Input,
  Separator,
  Skeleton,
  UserCircle2Icon,
  useToast,
} from "@registra/ui";
import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import type {
  AcquisitionType,
  DevelopmentBuyer,
  DevelopmentBuyerDetailProcess,
} from "@/features/developments/core/developments-schema";
import {
  acquisitionTypeLabels,
  buyerStatusLabels,
  maritalLabels,
  processStatusLabels,
} from "@/features/developments/core/developments-schema";
import { useDevelopmentBuyerDetailQuery } from "@/features/developments/hooks/use-development-queries";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { routes } from "@/shared/constants/routes";

const paramsSchema = z.object({
  developmentId: z.string().trim().min(1),
  buyerId: z.string().trim().min(1),
});

const processBlocks = [
  {
    key: "certificate",
    title: "Certificado",
    buyerInputs: [
      { label: "Enviar documento de identificação com foto" },
      { label: "Enviar comprovante de endereço atualizado" },
      { label: "Concluir cadastro no e-Notariado" },
    ],
    items: [
      { title: "Contato com o comprador", responsible: "Backoffice" },
      { title: "Envio de documentos", responsible: "Comprador" },
      { title: "Validação documental", responsible: "Backoffice" },
      { title: "Cadastro no e-Notariado", responsible: "Comprador" },
    ],
  },
  {
    key: "contract",
    title: "Contrato",
    buyerInputs: [
      { label: "Conferir dados da unidade e da compra" },
      { label: "Validar contrato assinado e escritura eletrônica" },
    ],
    resources: [
      { label: "Link enviado pelo backoffice", type: "link" as const },
      { label: "PDF do contrato assinado", type: "pdf" as const },
    ],
    items: [
      { title: "Envio da escritura", responsible: "Fornecedor" },
      { title: "Assinatura do contrato", responsible: "Comprador" },
    ],
  },
  {
    key: "registry",
    title: "Registro",
    buyerInputs: [
      { label: "Realizar pagamento do ITBI" },
      { label: "Enviar comprovante de pagamento do ITBI" },
    ],
    backofficeInputs: [
      { label: "Emitir guia do ITBI para pagamento" },
      { label: "Validar comprovante de pagamento do ITBI" },
      { label: "Protocolar documentação no cartório" },
    ],
    resources: [
      { label: "Comprovante de pagamento do ITBI", type: "receipt" as const },
      { label: "Guia do ITBI em PDF", type: "pdf" as const },
    ],
    items: [
      { title: "Conferência de ITBI", responsible: "Backoffice" },
      { title: "Protocolo em cartório", responsible: "Backoffice" },
      { title: "Emissão de matrícula", responsible: "Cartório" },
    ],
  },
] as const;

type ProcessBlock = (typeof processBlocks)[number];
type BlockStatus = "completed" | "in_progress" | "pending";

function resolveActiveBlockIndex(process: DevelopmentBuyerDetailProcess | null) {
  if (!process) {
    return 0;
  }

  if (process.status === "completed") {
    return processBlocks.length - 1;
  }

  const currentStage = process.currentStageName?.trim().toLowerCase() ?? "";

  if (currentStage.includes("registr")) {
    return 2;
  }

  if (currentStage.includes("contrat")) {
    return 1;
  }

  return 0;
}

function resolveBlockStatus(index: number, activeBlockIndex: number, process: DevelopmentBuyerDetailProcess | null): BlockStatus {
  if (process?.status === "completed") {
    return "completed";
  }

  if (index < activeBlockIndex) {
    return "completed";
  }

  if (index === activeBlockIndex) {
    return "in_progress";
  }

  return "pending";
}

function resolveBlockCurrentStep(block: ProcessBlock, index: number, activeBlockIndex: number, process: DevelopmentBuyerDetailProcess | null) {
  const blockStatus = resolveBlockStatus(index, activeBlockIndex, process);

  if (blockStatus === "completed") {
    return "Concluído";
  }

  if (blockStatus === "pending") {
    return "Aguardando início";
  }

  return process?.currentStageName?.trim() || block.items[0]?.title || "-";
}

function buildContractResourceLinks(process: DevelopmentBuyerDetailProcess | null) {
  const processId = process?.id ?? "contrato-pendente";

  return {
    linkUrl: `https://registra.ai/contrato/${processId}`,
    pdfUrl: `https://registra.ai/contrato/${processId}/pdf`,
  };
}

function buildRegistryResourceLinks(process: DevelopmentBuyerDetailProcess | null) {
  const processId = process?.id ?? "registro-pendente";

  return {
    receiptUrl: `https://registra.ai/registro/${processId}/comprovante-itbi`,
    pdfUrl: `https://registra.ai/registro/${processId}/guia-itbi.pdf`,
  };
}

function resolveBuyerInputLabels(block: ProcessBlock, acquisitionType: AcquisitionType | null) {
  if (block.key === "contract") {
    if (acquisitionType === "cash") {
      return [
        "Conferir dados da unidade e da compra à vista",
        "Validar comprovante de pagamento",
      ];
    }

    if (acquisitionType === "financing") {
      return [
        "Conferir dados da unidade e do financiamento",
        "Validar documentos da instituição financeira",
      ];
    }

    return block.buyerInputs.map((item) => item.label);
  }

  return block.buyerInputs.map((item) => item.label);
}

function resolveBackofficeInputLabels(block: ProcessBlock) {
  if ("backofficeInputs" in block) {
    return block.backofficeInputs.map((item) => item.label);
  }

  return [];
}

function resolveBuyerInputChecklist(
  block: ProcessBlock,
  blockIndex: number,
  activeBlockIndex: number,
  process: DevelopmentBuyerDetailProcess | null,
  acquisitionType: AcquisitionType | null,
) {
  const labels = resolveBuyerInputLabels(block, acquisitionType);
  const blockStatus = resolveBlockStatus(blockIndex, activeBlockIndex, process);

  if (blockStatus === "completed") {
    return labels.map((label) => ({ label, checked: true }));
  }

  if (blockStatus === "pending") {
    return labels.map((label) => ({ label, checked: false }));
  }

  const currentStageName = process?.currentStageName?.trim().toLowerCase() ?? "";
  const matchedIndex = block.items.findIndex((item) => currentStageName.includes(item.title.trim().toLowerCase()));
  const activeInputIndex = matchedIndex >= 0 ? matchedIndex : 0;

  return labels.map((label, index) => ({
    label,
    checked:
      process?.status === "completed" || process?.status === "cancelled"
        ? true
        : index < activeInputIndex,
  }));
}

function buildBuyerExperienceLink(developmentId: string, process: DevelopmentBuyerDetailProcess | null) {
  if (!process) {
    return `https://registra.ai/experience/${developmentId}`;
  }

  return `https://registra.ai/processo/${developmentId}/${process.id}`;
}

function formatDaysInStage(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diffInMs = Date.now() - date.getTime();
  const diffInDays = Math.max(0, Math.floor(diffInMs / (1000 * 60 * 60 * 24)));

  if (diffInDays === 0) {
    return "há menos de 1 dia";
  }

  return `há ${diffInDays} dia${diffInDays > 1 ? "s" : ""}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(date);
}

export function DevelopmentBuyerDetailPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contractAttachmentName, setContractAttachmentName] = useState<string | null>(null);
  const contractFileInputRef = useRef<HTMLInputElement | null>(null);
  const params = useParams<{ developmentId: string; buyerId: string }>();
  const parsedParams = paramsSchema.safeParse(params);
  const developmentId = parsedParams.success ? parsedParams.data.developmentId : null;
  const buyerId = parsedParams.success ? parsedParams.data.buyerId : null;
  const buyerDetailQuery = useDevelopmentBuyerDetailQuery(buyerId);
  const buyerDetail = buyerDetailQuery.data;
  const buyer = buyerDetail?.buyer ?? null;
  const process = buyerDetail?.process ?? null;

  const activeBlockIndex = useMemo(() => resolveActiveBlockIndex(process), [process]);
  const contractResources = useMemo(() => buildContractResourceLinks(process), [process]);
  const registryResources = useMemo(() => buildRegistryResourceLinks(process), [process]);
  
  if (!parsedParams.success) {
    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="p-5">
          <p className="type-body font-medium text-rose-700">Comprador inválido.</p>
        </CardContent>
      </Card>
    );
  }

  if (buyerDetailQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-[420px] rounded-2xl lg:col-span-8" />
          <Skeleton className="h-[420px] rounded-2xl lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (buyerDetailQuery.isError || !buyerDetail || !buyer) {
    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="space-y-3 p-5">
          <p className="type-body font-medium text-rose-700">
            {getApiErrorMessage(buyerDetailQuery.error, "Não foi possível carregar o detalhe do comprador.")}
          </p>
          <Button type="button" variant="outline" onClick={() => navigate(routes.developmentDetailById(parsedParams.data.developmentId))}>
            Voltar para o empreendimento
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (developmentId && buyerDetail.development.id && buyerDetail.development.id !== developmentId) {
    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="space-y-3 p-5">
          <p className="type-body font-medium text-rose-700">
            O comprador informado não pertence ao empreendimento desta rota.
          </p>
          <Button type="button" variant="outline" onClick={() => navigate(routes.developmentDetailById(developmentId))}>
            Voltar para o empreendimento
          </Button>
        </CardContent>
      </Card>
    );
  }

  const buyerExperienceLink = buildBuyerExperienceLink(
    developmentId ?? buyerDetail.development.id,
    process,
  );
  const enterpriseName =
    buyerDetail.supplier?.name ??
    "Empresa não informada";
  const unitLabel =
    buyer.unitLabel ??
    buyerDetail.availabilityItem?.displayLabel ??
    "Unidade não informada";
  const currentStepLabel =
    process?.currentStageName?.trim() ||
    (process?.status === "completed"
      ? "Registro concluído"
      : process?.status === "cancelled"
        ? "Processo cancelado"
        : "Em andamento");
  const processStatusLabel = process ? processStatusLabels[process.status] : "Sem processo";

  return (
    <section className="mx-auto max-w-7xl px-6">
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 border-border/70 bg-card/95 shadow-sm xl:col-span-8">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold leading-8 tracking-[-0.02em] text-foreground">
                    {buyer.name}
                  </h2>
                  <p className="type-body text-muted-foreground">{buyer.email || "-"}</p>
                  <p className="type-body text-muted-foreground">{buyer.phone || "-"}</p>
                </div>
              </div>

              <div className="space-y-1 text-left lg:text-right">
                <p className="type-body font-medium text-foreground">{enterpriseName}</p>
                <p className="type-body text-muted-foreground">{unitLabel}</p>
                <p className="type-caption text-muted-foreground">{buyerDetail.development.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 border-border/70 bg-card/95 shadow-sm xl:col-span-4">
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>Acessos rápidos para consulta da experiência do comprador.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={async () => {
                await navigator.clipboard.writeText(buyerExperienceLink);
                toast({
                  title: "Link copiado",
                  description: "O link da visão do comprador foi copiado para a área de transferência.",
                });
              }}
            >
              <GitBranchIcon className="mr-2 h-4 w-4" />
              Copiar link do comprador
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.open(buyerExperienceLink, "_blank", "noopener,noreferrer")}
            >
              <UserCircle2Icon className="mr-2 h-4 w-4" />
              Abrir visão do comprador
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-12 border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Status do processo</CardTitle>
            <CardDescription>Resumo imediato do ponto atual da jornada.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="type-overline text-muted-foreground">Etapa atual</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-foreground">
                    {currentStepLabel}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="type-overline text-muted-foreground">Status</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant={process?.status === "completed" ? "success" : "secondary"}>
                    {processStatusLabel}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Detalhe do progresso</CardTitle>
            <CardDescription>Macro do processo com status consolidado e etapa em evidência.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processBlocks.map((block, index) => {
                const blockStatus = resolveBlockStatus(index, activeBlockIndex, process);
                const isActive = index === activeBlockIndex;
                const blockChecklist = resolveBuyerInputChecklist(
                  block,
                  index,
                  activeBlockIndex,
                  process,
                  buyer.acquisitionType ?? null,
                );
                const blockBackofficeChecklist = (() => {
                  const labels = resolveBackofficeInputLabels(block);

                  if (labels.length === 0) {
                    return [];
                  }

                  if (blockStatus === "completed") {
                    return labels.map((label) => ({ label, checked: true }));
                  }

                  if (blockStatus === "pending") {
                    return labels.map((label) => ({ label, checked: false }));
                  }

                  const currentStageName = process?.currentStageName?.trim().toLowerCase() ?? "";
                  const matchedIndex = block.items.findIndex((item) =>
                    currentStageName.includes(item.title.trim().toLowerCase()),
                  );
                  const activeInputIndex = matchedIndex >= 0 ? matchedIndex : 0;

                  return labels.map((label, inputIndex) => ({
                    label,
                    checked: process?.status === "completed" ? true : inputIndex < activeInputIndex,
                  }));
                })();
                const badge =
                  blockStatus === "completed"
                    ? { label: "Concluído", variant: "success" as const }
                    : blockStatus === "in_progress"
                      ? { label: "Em andamento", variant: "secondary" as const }
                      : { label: "Pendente", variant: "outline" as const };
                const blockTimeLabel =
                  blockStatus === "in_progress" ? formatDaysInStage(process?.updatedAt) : null;

                return (
                  <Card
                    key={block.key}
                    className={
                      isActive
                        ? "border-primary/30 bg-primary/5 shadow-sm"
                        : "border-border/70 bg-background/70 shadow-none"
                    }
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle>{block.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          {blockTimeLabel ? (
                            <span className="type-caption text-muted-foreground">{blockTimeLabel}</span>
                          ) : null}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
                        <div className="space-y-2">
                          <p className="type-overline text-muted-foreground">Etapa do bloco</p>
                          <p className="type-body text-muted-foreground">
                            {resolveBlockCurrentStep(block, index, activeBlockIndex, process)}
                          </p>
                          <p className="type-caption text-muted-foreground">
                            {blockChecklist.length} etapa(s) previstas neste bloco
                          </p>
                        </div>
                        <div className="space-y-4">
                          {blockBackofficeChecklist.length > 0 ? (
                            <div className="space-y-2">
                              <p className="type-overline text-muted-foreground">Checklist do backoffice</p>
                              <div className="grid gap-2 md:grid-cols-2">
                                {blockBackofficeChecklist.map((item) => (
                                  <label key={item.label} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2">
                                    <Checkbox checked={item.checked} disabled />
                                    <span className="type-caption text-muted-foreground">{item.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          <div className="space-y-2">
                            <p className="type-overline text-muted-foreground">
                              {block.key === "contract" ? "Checklist do backoffice" : "Checklist do comprador"}
                            </p>
                            <div className="grid gap-2 md:grid-cols-2">
                              {blockChecklist.map((item) => (
                                <label key={item.label} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2">
                                  <Checkbox checked={item.checked} disabled />
                                  <span className="type-caption text-muted-foreground">{item.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      {(block.key === "contract" || block.key === "registry") && "resources" in block ? (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <div className="grid gap-2 md:grid-cols-2">
                              <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                                <span className="type-caption text-muted-foreground">{block.resources[0].label}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={blockStatus === "pending"}
                                  onClick={() =>
                                    window.open(
                                      block.key === "contract"
                                        ? contractResources.linkUrl
                                        : registryResources.receiptUrl,
                                      "_blank",
                                      "noopener,noreferrer",
                                    )
                                  }
                                >
                                  {block.key === "contract" ? "Abrir link" : "Ver comprovante"}
                                </Button>
                              </div>
                              <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                                <span className="type-caption text-muted-foreground">{block.resources[1].label}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={blockStatus === "pending"}
                                  onClick={() =>
                                    window.open(
                                      block.key === "contract" ? contractResources.pdfUrl : registryResources.pdfUrl,
                                      "_blank",
                                      "noopener,noreferrer",
                                    )
                                  }
                                >
                                  Ver PDF
                                </Button>
                              </div>
                            </div>
                            {block.key === "contract" ? (
                              <div className="rounded-lg border border-border/60 px-3 py-3">
                                <div className="space-y-2">
                                  <p className="type-caption text-muted-foreground">Enviar CTT ou Escritura</p>
                                  <Input
                                    ref={contractFileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={(event) => {
                                      const file = event.target.files?.[0] ?? null;
                                      setContractAttachmentName(file?.name ?? null);

                                      if (file) {
                                        toast({
                                          title: "Arquivo selecionado",
                                          description: `${file.name} pronto para envio nesta etapa.`,
                                        });
                                      }
                                    }}
                                  />
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => contractFileInputRef.current?.click()}
                                    >
                                      Selecionar arquivo
                                    </Button>
                                    <p className="type-caption text-muted-foreground">
                                      {contractAttachmentName ?? "Nenhum arquivo selecionado"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Dados do comprador</CardTitle>
            <CardDescription>Resumo cadastral e comercial retornado pelo endpoint de detalhe.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="type-overline text-muted-foreground">CPF</p>
                <p className="mt-3 text-base font-semibold text-foreground">{buyer.cpf || "-"}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="type-overline text-muted-foreground">Estado civil</p>
                <p className="mt-3 text-base font-semibold text-foreground">
                  {buyer.maritalStatus ? maritalLabels[buyer.maritalStatus] : "-"}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="type-overline text-muted-foreground">Aquisição</p>
                <p className="mt-3 text-base font-semibold text-foreground">
                  {buyer.acquisitionType ? acquisitionTypeLabels[buyer.acquisitionType] : "-"}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="type-overline text-muted-foreground">Contrato</p>
                <p className="mt-3 text-base font-semibold text-foreground">{formatDate(buyer.contractDate)}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="type-overline text-muted-foreground">Nacionalidade</p>
                <p className="mt-3 text-base font-semibold text-foreground">{buyer.nationality ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="type-overline text-muted-foreground">Profissão</p>
                <p className="mt-3 text-base font-semibold text-foreground">{buyer.profession ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="type-overline text-muted-foreground">Status</p>
                <p className="mt-3 text-base font-semibold text-foreground">{buyerStatusLabels[buyer.status]}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="type-overline text-muted-foreground">Criado em</p>
                <p className="mt-3 text-base font-semibold text-foreground">{formatDate(buyer.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
