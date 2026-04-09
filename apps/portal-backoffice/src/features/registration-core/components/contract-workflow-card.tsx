import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Select } from "@registra/ui";
import type { ProcessDocument, ProcessRequest, ProcessSubmission, WorkflowBlock, WorkflowBlockStatus } from "@registra/shared";
import { ArrowUpRight, CheckCircle2, Clock3, FileSignature, Paperclip, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { StatusBadge } from "@/features/registration-core/components/status-badge";
import { WorkflowBuyerResponseSheet } from "@/features/registration-core/components/workflow-buyer-response-sheet";
import {
  blockStatusLabels,
  formatDateTime,
  requestStatusLabels,
  requestTargetLabels,
  requestTypeLabels,
} from "@/features/registration-core/core/registration-presenters";

interface ContractWorkflowCardProps {
  block: WorkflowBlock;
  collapsed: boolean;
  documents: ProcessDocument[];
  requests: ProcessRequest[];
  submissions: ProcessSubmission[];
  onUpdateStatus: (blockKey: WorkflowBlock["key"], status: WorkflowBlockStatus) => void;
  onSaveGeneratedContractPdf: (blockKey: WorkflowBlock["key"], fileName: string) => void;
  onSaveSignatureLink: (blockKey: WorkflowBlock["key"], signatureLink: string) => void;
}

const contractStages = ["Documento base", "Preparação jurídica", "Assinatura", "Conclusão"] as const;

const contractStageIndexByStatus: Record<WorkflowBlock["status"], number> = {
  pending: 0,
  waiting_supplier: 0,
  in_review: 1,
  rejected: 1,
  approved: 3,
  in_preparation: 1,
  waiting_signature: 2,
  signed: 3,
  waiting_payment: 0,
  in_registry: 0,
  waiting_registry_office: 0,
  requirement_open: 0,
  requirement_resolved: 0,
  registered: 3,
};

const contractStatusOptions: WorkflowBlockStatus[] = [
  "pending",
  "waiting_supplier",
  "in_preparation",
  "waiting_signature",
  "signed",
  "rejected",
  "approved",
];

export function ContractWorkflowCard({
  block,
  collapsed,
  documents,
  requests,
  submissions,
  onUpdateStatus,
  onSaveGeneratedContractPdf,
  onSaveSignatureLink,
}: ContractWorkflowCardProps) {
  const stageIndex = contractStageIndexByStatus[block.status] ?? 0;
  const latestRequest = requests[0] ?? null;
  const [draftStatus, setDraftStatus] = useState<WorkflowBlockStatus>(block.status);
  const [signatureLinkDraft, setSignatureLinkDraft] = useState(block.signatureLink ?? "");
  const [contractPdfDraft, setContractPdfDraft] = useState(block.generatedContractPdfName ?? "");
  const contractPdfInputRef = useRef<HTMLInputElement | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  useEffect(() => {
    setDraftStatus(block.status);
    setSignatureLinkDraft(block.signatureLink ?? "");
    setContractPdfDraft(block.generatedContractPdfName ?? "");
  }, [block.generatedContractPdfName, block.signatureLink, block.status]);

  const isCompletedStatus = (status: WorkflowBlockStatus) => {
    return status === "signed" || status === "approved";
  };

  const handleUpdateClick = () => {
    if (isCompletedStatus(draftStatus) && !isCompletedStatus(block.status)) {
      setIsConfirmDialogOpen(true);
    } else {
      onUpdateStatus(block.key, draftStatus);
    }
  };

  const confirmUpdate = () => {
    setIsConfirmDialogOpen(false);
    onUpdateStatus(block.key, draftStatus);
  };

  return (
    <>
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar conclusão da etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está marcando a etapa de contrato como concluída. O card será fechado e desativado após essa ação. Deseja prosseguir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdate}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className={["overflow-hidden border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(247,248,250,0.95))] shadow-sm transition-all", collapsed ? "opacity-75" : ""].join(" ")}>
        <CardHeader className={["space-y-4 bg-background/70", collapsed ? "pb-5" : "border-b border-border/60 pb-5"].join(" ")}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <FileSignature className="h-3.5 w-3.5" />
                Jornada de contrato
              </div>
            <div>
              <CardTitle className="text-[1.35rem]">Contrato</CardTitle>
              <CardDescription className="mt-1 max-w-2xl text-sm">{block.documentsSummary}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={block.status} label={blockStatusLabels[block.status]} />
          </div>
        </div>

        {collapsed ? null : (
        <div className="grid gap-3 lg:grid-cols-4">
          {contractStages.map((stage, index) => {
            const completed = index < stageIndex;
            const current = index === stageIndex;

            return (
              <div
                key={stage}
                className={[
                  "rounded-2xl border px-4 py-3 transition-colors",
                  completed && "border-emerald-200 bg-emerald-50/80",
                  current && "border-slate-900 bg-slate-950 text-white",
                  !completed && !current && "border-border/70 bg-background/70",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <p className={["text-[11px] uppercase tracking-[0.18em]", current ? "text-white/70" : "text-muted-foreground"].join(" ")}>
                  Etapa {index + 1}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {completed ? <CheckCircle2 className="h-4 w-4" /> : null}
                  {current ? <Clock3 className="h-4 w-4" /> : null}
                  <p className="font-medium">{stage}</p>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </CardHeader>

      {collapsed ? null : (
      <CardContent className="space-y-5 p-6 pointer-events-auto">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Leitura operacional</p>
            <p className="mt-2 text-sm leading-6 text-foreground/80">{block.latestResponseSummary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">Validação: {block.validationOwner}</Badge>
              <Badge variant="outline">Atualizado em {formatDateTime(block.lastUpdatedAt)}</Badge>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Próxima ação</p>
            {block.supplierActionRequired ? (
              <div className="mt-3 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Supplier precisa responder
                </div>
                <p className="text-sm text-foreground/80">
                  Envie a minuta ou o link de assinatura para permitir que o comprador conclua a assinatura na plataforma terceira.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-foreground/80">
                O backoffice pode validar a assinatura concluída e liberar a próxima etapa do processo.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Link de assinatura externa</p>
              <Input
                value={signatureLinkDraft}
                onChange={(event) => setSignatureLinkDraft(event.currentTarget.value)}
                placeholder="https://plataforma-parceira.com/assinatura/contrato"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onSaveSignatureLink(block.key, signatureLinkDraft)}
              disabled={signatureLinkDraft === (block.signatureLink ?? "")}
            >
              Salvar link
            </Button>
          </div>
        </div>

        {block.status === "signed" || block.generatedContractPdfName ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="w-full space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Contrato final em PDF</p>
                <Input
                  value={contractPdfDraft}
                  readOnly
                  placeholder="Selecione o PDF final assinado para armazenamento"
                />
                <input
                  ref={contractPdfInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(event) => setContractPdfDraft(event.currentTarget.files?.[0]?.name ?? "")}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => contractPdfInputRef.current?.click()}>
                  <Paperclip className="mr-2 h-4 w-4" />
                  Escolher PDF
                </Button>
                <Button
                  type="button"
                  onClick={() => onSaveGeneratedContractPdf(block.key, contractPdfDraft)}
                  disabled={!contractPdfDraft || contractPdfDraft === (block.generatedContractPdfName ?? "")}
                >
                  Anexar PDF final
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {latestRequest ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Solicitação mais recente</p>
                <p className="mt-2 font-medium">{latestRequest.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{latestRequest.description}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{requestStatusLabels[latestRequest.status]}</Badge>
              <Badge variant="outline">{requestTargetLabels[latestRequest.target]}</Badge>
              <Badge variant="outline">{requestTypeLabels[latestRequest.type]}</Badge>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Atualizar etapa</p>
              <Select
                value={draftStatus}
                onChange={(event) => setDraftStatus(event.currentTarget.value as WorkflowBlockStatus)}
              >
                {contractStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {blockStatusLabels[status]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm">
                Criar solicitação
              </Button>
              <WorkflowBuyerResponseSheet block={block} documents={documents} requests={requests} submissions={submissions} />
              <Button
                type="button"
                size="sm"
                onClick={handleUpdateClick}
                disabled={draftStatus === block.status}
              >
                Atualizar etapa
              </Button>
            </div>
          </div>
        </div>
        </CardContent>
        )}
      </Card>
    </>
  );
}
