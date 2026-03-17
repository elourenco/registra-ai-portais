import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CheckIcon,
  CircleDotIcon,
  Clock3Icon,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FileTextIcon,
  Input,
  Skeleton,
} from "@registra/ui";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";

import {
  processStatusLabels,
  type DevelopmentDetailResult,
} from "@/features/developments/core/developments-schema";
import { useDevelopmentDetailQuery } from "@/features/developments/hooks/use-development-queries";
import { getApiErrorMessage } from "@/shared/api/http-client";

const paramsSchema = z.object({
  developmentId: z.string().trim().min(1),
  processId: z.string().trim().min(1),
});

const templateBlocks = [
  {
    key: "certificate",
    title: "Certificado",
    description: "Etapa inicial do processo para contato, coleta, validacao e entrega do certificado digital.",
    items: [
      {
        title: "Contato com o cliente",
        owner: "Backoffice",
        optional: false,
        statusOptions: ["pending", "completed"],
      },
      {
        title: "Receber documentos pessoais",
        owner: "Comprador",
        optional: false,
        documents: ["RG ou CNH", "Comprovante de endereco"],
        statusOptions: ["awaiting_submission", "submitted"],
      },
      {
        title: "Validar documentos",
        owner: "Backoffice",
        optional: false,
        actions: ["aprovar", "reprovar", "solicitar reenvio"],
        statusOptions: ["under_review", "approved", "rejected", "rework_requested"],
      },
      {
        title: "Cadastro no e-Notariado",
        owner: "Comprador",
        optional: false,
        statusOptions: ["nao_cadastrado", "cadastrado"],
      },
    ],
  },
  {
    key: "contract",
    title: "Contrato",
    description: "Consolidacao contratual do negocio depois da conclusao do certificado.",
    items: [
      { title: "Enviar escritura", owner: "Supplier", optional: false },
      { title: "Assinar contrato", owner: "Comprador", optional: false },
    ],
  },
  {
    key: "registration",
    title: "Registro",
    description: "Fechamento registral ate a emissao da matricula do imovel.",
    items: [
      { title: "Confirmar ITBI", owner: "Backoffice", optional: false },
      { title: "Enviar matricula", owner: "Backoffice", optional: false },
    ],
  },
] as const;

type ProcessData = DevelopmentDetailResult["processes"][number];
type TemplateBlock = (typeof templateBlocks)[number];
type TemplateItem = TemplateBlock["items"][number];
type Tone = "success" | "warning" | "danger" | "secondary";
type ItemState = "completed" | "current" | "pending" | "optional";
type CertificateItemStatus =
  | "pending"
  | "completed"
  | "awaiting_submission"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "rework_requested"
  | "nao_cadastrado"
  | "cadastrado";
type CertificateBlockStatus = "pendente" | "em andamento" | "emitido";

interface ProcessSummary {
  stageTitle: string;
  badgeLabel: string;
  badgeVariant: Tone;
  responsibilityLabel: string;
  nextActionLabel: string;
  activeBlockIndex: number;
}

interface CertificateWorkflowState {
  consolidatedStatus: CertificateBlockStatus;
  items: Record<string, CertificateItemStatus>;
}

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

function buildShareToken(developmentId: string, process: ProcessData) {
  return [
    "sup",
    developmentId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12),
    process.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12),
    (process.buyerId ?? "buyer").replace(/[^a-zA-Z0-9]/g, "").slice(0, 12),
  ]
    .filter(Boolean)
    .join("-");
}

function buildShareLink(developmentId: string, process: ProcessData) {
  return `https://registra.ai/processo/${buildShareToken(developmentId, process)}`;
}

function resolveActiveBlockIndex(process: ProcessData) {
  if (process.status === "completed") {
    return templateBlocks.length - 1;
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

function resolveProcessSummary(process: ProcessData): ProcessSummary {
  const activeBlockIndex = resolveActiveBlockIndex(process);
  const stageTitle = process.currentStageName?.trim() || templateBlocks[activeBlockIndex]?.title || "Certificado";

  if (process.status === "completed") {
    return {
      stageTitle,
      badgeLabel: "Concluido",
      badgeVariant: "success",
      responsibilityLabel: "Sem acao pendente",
      nextActionLabel: "Registro finalizado",
      activeBlockIndex,
    };
  }

  if (process.status === "waiting_supplier") {
    return {
      stageTitle,
      badgeLabel: "Aguardando informacoes",
      badgeVariant: "warning",
      responsibilityLabel: "Supplier",
      nextActionLabel: activeBlockIndex === 1 ? "Enviar escritura" : "Revisar pendencias do processo",
      activeBlockIndex,
    };
  }

  if (process.status === "waiting_registry_office") {
    return {
      stageTitle,
      badgeLabel: "Aguardando cartorio",
      badgeVariant: "secondary",
      responsibilityLabel: "Cartorio",
      nextActionLabel: "Acompanhar retorno do cartorio",
      activeBlockIndex,
    };
  }

  if (process.status === "requirement_open") {
    return {
      stageTitle,
      badgeLabel: "Com pendencia",
      badgeVariant: "danger",
      responsibilityLabel: "Comprador",
      nextActionLabel: "Enviar RG",
      activeBlockIndex,
    };
  }

  if (process.status === "overdue") {
    return {
      stageTitle,
      badgeLabel: "Em atraso",
      badgeVariant: "danger",
      responsibilityLabel: "Comprador",
      nextActionLabel: "Regularizar item pendente",
      activeBlockIndex,
    };
  }

  return {
    stageTitle,
    badgeLabel: "Aguardando envio",
    badgeVariant: "warning",
    responsibilityLabel: "Comprador",
    nextActionLabel: activeBlockIndex === 0 ? "Enviar RG" : activeBlockIndex === 1 ? "Assinar contrato" : "Acompanhar registro",
    activeBlockIndex,
  };
}

function getCertificateWorkflowState(process: ProcessData): CertificateWorkflowState {
  const activeBlockIndex = resolveActiveBlockIndex(process);

  if (process.status === "completed" || activeBlockIndex >= 2) {
    return {
      consolidatedStatus: "emitido",
      items: {
        "Contato com o cliente": "completed",
        "Receber documentos pessoais": "submitted",
        "Validar documentos": "approved",
        "Cadastro no e-Notariado": "cadastrado",
      },
    };
  }

  if (activeBlockIndex === 1) {
    return {
      consolidatedStatus: "emitido",
      items: {
        "Contato com o cliente": "completed",
        "Receber documentos pessoais": "submitted",
        "Validar documentos": "approved",
        "Cadastro no e-Notariado": "cadastrado",
      },
    };
  }

  if (process.status === "requirement_open" || process.status === "overdue") {
    return {
      consolidatedStatus: "em andamento",
      items: {
        "Contato com o cliente": "completed",
        "Receber documentos pessoais": "awaiting_submission",
        "Validar documentos": "rework_requested",
        "Cadastro no e-Notariado": "nao_cadastrado",
      },
    };
  }

  if (process.pendingRequirements === 0) {
    return {
      consolidatedStatus: "em andamento",
      items: {
        "Contato com o cliente": "completed",
        "Receber documentos pessoais": "submitted",
        "Validar documentos": "under_review",
        "Cadastro no e-Notariado": "nao_cadastrado",
      },
    };
  }

  return {
    consolidatedStatus: "pendente",
    items: {
      "Contato com o cliente": "pending",
      "Receber documentos pessoais": "awaiting_submission",
      "Validar documentos": "under_review",
      "Cadastro no e-Notariado": "nao_cadastrado",
    },
  };
}

function buildAlerts(process: ProcessData, summary: ProcessSummary) {
  const alerts: Array<{ title: string; description: string; tone: "warning" | "danger" }> = [];

  if (process.pendingRequirements > 0) {
    alerts.push({
      title: "Pendencias em aberto",
      description: `${process.pendingRequirements} item(ns) ainda precisam de retorno para o processo avancar.`,
      tone: process.status === "overdue" ? "danger" : "warning",
    });
  }

  if (summary.responsibilityLabel === "Comprador") {
    alerts.push({
      title: "Aguardando comprador",
      description: "O proximo passo depende do comprador. Compartilhe o link para acelerar a resposta.",
      tone: "warning",
    });
  }

  if (process.status === "requirement_open") {
    alerts.push({
      title: "Documento rejeitado ou incompleto",
      description: "Existe uma exigencia aberta neste processo e o comprador precisa reenviar informacoes.",
      tone: "danger",
    });
  }

  return alerts;
}

function itemStatusVariant(state: ItemState): Tone {
  if (state === "completed") {
    return "success";
  }

  if (state === "current") {
    return "warning";
  }

  if (state === "optional") {
    return "secondary";
  }

  return "secondary";
}

function itemStatusLabel(state: ItemState) {
  if (state === "completed") {
    return "Concluido";
  }

  if (state === "current") {
    return "Pendente";
  }

  if (state === "optional") {
    return "Opcional";
  }

  return "Pendente";
}

function certificateStatusVariant(status: CertificateItemStatus | CertificateBlockStatus): Tone {
  switch (status) {
    case "completed":
    case "approved":
    case "cadastrado":
    case "emitido":
      return "success";
    case "rejected":
    case "rework_requested":
      return "danger";
    case "submitted":
    case "under_review":
    case "em andamento":
      return "warning";
    default:
      return "secondary";
  }
}

function certificateStatusLabel(status: CertificateItemStatus | CertificateBlockStatus) {
  const labels: Record<CertificateItemStatus | CertificateBlockStatus, string> = {
    pending: "Pendente",
    completed: "Concluido",
    awaiting_submission: "Aguardando envio",
    submitted: "Enviado",
    under_review: "Em analise",
    approved: "Aprovado",
    rejected: "Reprovado",
    rework_requested: "Reenvio solicitado",
    nao_cadastrado: "Nao cadastrado",
    cadastrado: "Cadastrado",
    pendente: "Pendente",
    "em andamento": "Em andamento",
    emitido: "Emitido",
  };

  return labels[status];
}

function formatStatusOptionLabel(value: string) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    completed: "Concluido",
    awaiting_submission: "Aguardando envio",
    submitted: "Enviado",
    under_review: "Em analise",
    approved: "Aprovado",
    rejected: "Reprovado",
    rework_requested: "Reenvio solicitado",
    nao_cadastrado: "Nao cadastrado",
    cadastrado: "Cadastrado",
  };

  return labels[value] ?? value;
}

function resolveItemState(
  blockIndex: number,
  itemIndex: number,
  activeIndex: number,
  processStatus: ProcessData["status"],
  item: TemplateItem,
): ItemState {
  if (item.optional && blockIndex >= activeIndex) {
    return "optional";
  }

  if (processStatus === "completed" || blockIndex < activeIndex) {
    return "completed";
  }

  if (blockIndex === activeIndex && itemIndex === 0) {
    return "current";
  }

  return "pending";
}

function AlertCard({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: "warning" | "danger";
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        tone === "danger" ? "border-rose-200 bg-rose-50/80" : "border-amber-200 bg-amber-50/80"
      }`}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function DevelopmentProcessDetailPage() {
  const params = useParams<{ developmentId: string; processId: string }>();
  const parsedParams = paramsSchema.safeParse(params);
  const developmentId = parsedParams.success ? parsedParams.data.developmentId : null;
  const processId = parsedParams.success ? parsedParams.data.processId : null;
  const developmentQuery = useDevelopmentDetailQuery(developmentId);
  const [copied, setCopied] = useState(false);
  const [isReminderOpen, setReminderOpen] = useState(false);

  const process = useMemo(() => {
    if (!developmentQuery.data || !processId) {
      return null;
    }

    return developmentQuery.data.processes.find((item) => item.id === processId) ?? null;
  }, [developmentQuery.data, processId]);

  const summary = useMemo(() => (process ? resolveProcessSummary(process) : null), [process]);
  const shareLink = useMemo(
    () => (developmentId && process ? buildShareLink(developmentId, process) : ""),
    [developmentId, process],
  );
  const buyerWhatsappLink = useMemo(() => {
    if (!shareLink) {
      return "";
    }

    return `https://wa.me/?text=${encodeURIComponent(`Olá, finalize seu processo aqui:\n${shareLink}`)}`;
  }, [shareLink]);
  const alerts = useMemo(() => (process && summary ? buildAlerts(process, summary) : []), [process, summary]);
  const certificateState = useMemo(() => (process ? getCertificateWorkflowState(process) : null), [process]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  if (!parsedParams.success) {
    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="p-5">
          <p className="font-medium text-rose-700">Processo invalido.</p>
        </CardContent>
      </Card>
    );
  }

  if (developmentQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (developmentQuery.isError || !process || !summary) {
    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="p-5">
          <p className="font-medium text-rose-700">
            {getApiErrorMessage(developmentQuery.error, "Nao foi possivel carregar o processo.")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Processo #{process.id}</CardTitle>
              <CardDescription className="text-base">
                {process.buyerName ?? "Comprador"} • {process.propertyLabel || "Unidade nao informada"}
              </CardDescription>
            </div>
            <Badge variant={summary.badgeVariant}>{processStatusLabels[process.status]}</Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="gap-4">
            <CardTitle>O que esta acontecendo agora</CardTitle>
            <CardDescription>Acompanhamento rapido do momento atual do processo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Etapa atual</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{summary.stageTitle}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Status</p>
                <div className="mt-2">
                  <Badge variant={summary.badgeVariant}>{summary.badgeLabel}</Badge>
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Responsavel</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{summary.responsibilityLabel}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-amber-700">Proxima acao</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{summary.nextActionLabel}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Atualizado em {formatProcessUpdatedAt(process.updatedAt)}.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="gap-4">
            <CardTitle>Acesso do comprador</CardTitle>
            <CardDescription>Compartilhe este link para o comprador continuar o processo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={shareLink} readOnly aria-label="Link compartilhavel do processo" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(shareLink);
                  setCopied(true);
                }}
              >
                {copied ? "Link copiado" : "Copiar link"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.open(shareLink, "_blank", "noopener,noreferrer");
                }}
              >
                Abrir como comprador
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.open(buyerWhatsappLink, "_blank", "noopener,noreferrer");
                }}
              >
                Enviar via WhatsApp
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReminderOpen(true)}
                disabled={summary.responsibilityLabel !== "Comprador"}
              >
                Cobrar cliente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Etapas do processo</CardTitle>
          <CardDescription>Somente o essencial para acompanhar quem precisa agir e o que falta concluir.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {templateBlocks.map((block, blockIndex) => {
            const blockState =
              blockIndex < summary.activeBlockIndex
                ? "completed"
                : blockIndex === summary.activeBlockIndex
                  ? "current"
                  : "pending";

            return (
              <div key={block.key} className="rounded-2xl border border-border/70 bg-background/70 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-foreground">{block.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {block.description ??
                        (blockState === "completed"
                          ? "Etapa concluida"
                          : blockState === "current"
                            ? "Etapa em andamento"
                            : "Etapa futura")}
                    </p>
                  </div>
                  {block.key === "certificate" && certificateState ? (
                    <Badge variant={certificateStatusVariant(certificateState.consolidatedStatus)}>
                      Certificado {certificateStatusLabel(certificateState.consolidatedStatus)}
                    </Badge>
                  ) : (
                    <Badge variant={blockState === "completed" ? "success" : blockState === "current" ? "warning" : "outline"}>
                      {blockState === "completed" ? "Concluida" : blockState === "current" ? "Atual" : "Futura"}
                    </Badge>
                  )}
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {block.items.map((item, itemIndex) => {
                    const state = resolveItemState(
                      blockIndex,
                      itemIndex,
                      summary.activeBlockIndex,
                      process.status,
                      item,
                    );

                    return (
                      <div key={item.title} className="rounded-xl border border-border/70 bg-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="font-medium text-foreground">{item.title}</p>
                            <div className="flex flex-wrap gap-2">
                              {block.key === "certificate" && certificateState ? (
                                <Badge
                                  variant={certificateStatusVariant(
                                    certificateState.items[item.title] ?? "pending",
                                  )}
                                >
                                  {certificateStatusLabel(
                                    certificateState.items[item.title] ?? "pending",
                                  )}
                                </Badge>
                              ) : (
                                <Badge variant={itemStatusVariant(state)}>{itemStatusLabel(state)}</Badge>
                              )}
                              <Badge variant="outline">{item.owner}</Badge>
                            </div>
                            {"documents" in item && Array.isArray(item.documents) ? (
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p className="font-medium text-foreground">Documentos obrigatorios</p>
                                {item.documents.map((document: string) => (
                                  <p key={document}>• {document}</p>
                                ))}
                              </div>
                            ) : null}
                            {"actions" in item && Array.isArray(item.actions) ? (
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p className="font-medium text-foreground">Acoes permitidas</p>
                                {item.actions.map((action: string) => (
                                  <p key={action}>• {action}</p>
                                ))}
                              </div>
                            ) : null}
                            {"statusOptions" in item && item.statusOptions ? (
                              <p className="text-sm text-muted-foreground">
                                Estados: {item.statusOptions.map((status) => formatStatusOptionLabel(status)).join(" | ")}
                              </p>
                            ) : null}
                            {block.key === "certificate" && item.title === "Cadastro no e-Notariado" ? (
                              <p className="text-sm text-muted-foreground">
                                Leitura informativa para o supplier: mostra apenas se o comprador ja se cadastrou no e-Notariado.
                              </p>
                            ) : null}
                          </div>
                          {block.key === "certificate" && certificateState ? (
                            certificateState.items[item.title] === "completed" ||
                            certificateState.items[item.title] === "approved" ||
                            certificateState.items[item.title] === "cadastrado" ? (
                              <CheckIcon className="mt-1 h-4 w-4 text-emerald-600" />
                            ) : certificateState.items[item.title] === "under_review" ||
                                certificateState.items[item.title] === "submitted" ? (
                              <Clock3Icon className="mt-1 h-4 w-4 text-amber-600" />
                            ) : (
                              <FileTextIcon className="mt-1 h-4 w-4 text-muted-foreground" />
                            )
                          ) : state === "completed" ? (
                            <CheckIcon className="mt-1 h-4 w-4 text-emerald-600" />
                          ) : state === "current" ? (
                            <Clock3Icon className="mt-1 h-4 w-4 text-amber-600" />
                          ) : (
                            <FileTextIcon className="mt-1 h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {block.key === "certificate" ? (
                  <div className="mt-4 rounded-xl border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Regras do bloco</p>
                    <p className="mt-2">O bloco avanca apenas quando os itens obrigatorios estiverem aprovados.</p>
                    <p>Se os documentos forem rejeitados, o fluxo retorna para a etapa de envio.</p>
                    <p>O processo registra historico de acoes e suporta multiplas versoes de documentos.</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {alerts.length > 0 ? (
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
            <CardDescription>Somente avisos relevantes para acompanhamento do supplier.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {alerts.map((alert) => (
              <AlertCard
                key={`${alert.title}-${alert.description}`}
                title={alert.title}
                description={alert.description}
                tone={alert.tone}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={isReminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cobrar cliente</DialogTitle>
            <DialogDescription>
              Use a mensagem pronta para pedir que o comprador continue o processo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              value={`Olá, finalize seu processo aqui:\n${shareLink}`}
              readOnly
              aria-label="Mensagem pronta para WhatsApp"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReminderOpen(false)}>
              Fechar
            </Button>
            <Button
              type="button"
              onClick={() => {
                window.open(buyerWhatsappLink, "_blank", "noopener,noreferrer");
                setReminderOpen(false);
              }}
            >
              Enviar via WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
