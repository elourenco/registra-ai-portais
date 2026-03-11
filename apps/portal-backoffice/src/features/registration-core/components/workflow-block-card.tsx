import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select } from "@registra/ui";
import type { ProcessDocument, ProcessRequest, ProcessSubmission, WorkflowBlock, WorkflowBlockStatus } from "@registra/shared";
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, LockKeyhole, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { StatusBadge } from "@/features/registration-core/components/status-badge";
import { WorkflowBuyerResponseSheet } from "@/features/registration-core/components/workflow-buyer-response-sheet";
import {
  blockStatusLabels,
  blockTitleLabels,
  formatDateTime,
} from "@/features/registration-core/core/registration-presenters";

interface WorkflowBlockCardProps {
  block: WorkflowBlock;
  collapsed: boolean;
  documents: ProcessDocument[];
  requests: ProcessRequest[];
  submissions: ProcessSubmission[];
  onUpdateStatus: (blockKey: WorkflowBlock["key"], status: WorkflowBlockStatus) => void;
  onToggleCollapse: (blockKey: WorkflowBlock["key"]) => void;
}

const statusOptionsByBlock: Record<WorkflowBlock["key"], WorkflowBlockStatus[]> = {
  certificate: ["pending", "waiting_supplier", "in_review", "rejected", "approved"],
  contract: ["pending", "waiting_supplier", "in_preparation", "waiting_signature", "signed", "rejected", "approved"],
  registration: [
    "pending",
    "waiting_payment",
    "in_registry",
    "waiting_registry_office",
    "requirement_open",
    "requirement_resolved",
    "registered",
  ],
};

const categoryLabels: Record<WorkflowBlock["key"], string> = {
  certificate: "Jornada de certificado",
  contract: "Jornada de contrato",
  registration: "Jornada de registro",
};

export function WorkflowBlockCard({
  block,
  collapsed,
  documents,
  requests,
  submissions,
  onUpdateStatus,
  onToggleCollapse,
}: WorkflowBlockCardProps) {
  const [draftStatus, setDraftStatus] = useState<WorkflowBlockStatus>(block.status);

  useEffect(() => {
    setDraftStatus(block.status);
  }, [block.status]);

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader className={["space-y-4 bg-background/70", collapsed ? "pb-5" : "border-b border-border/60 pb-5"].join(" ")}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {categoryLabels[block.key]}
            </div>
            <div>
              <CardTitle className="text-[1.35rem]">{block.title}</CardTitle>
              <CardDescription className="mt-1 text-sm">{block.documentsSummary}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={block.status} label={blockStatusLabels[block.status]} />
            <Button type="button" variant="outline" size="sm" onClick={() => onToggleCollapse(block.key)}>
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {collapsed ? null : (
      <CardContent className="space-y-5 p-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Leitura operacional</p>
            <p className="mt-2 text-sm leading-6 text-foreground/80">{block.latestResponseSummary}</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Contexto do bloco</p>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Validação: {block.validationOwner}
              </span>
              <span className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Atualizado em {formatDateTime(block.lastUpdatedAt)}
              </span>
              <span className="flex items-center gap-2">
                {block.canStart ? <CheckCircle2 className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                {block.canStart
                  ? "Bloco liberado para operação"
                  : `Bloqueado por dependência de ${block.dependsOn ? blockTitleLabels[block.dependsOn] : "etapa anterior"}`}
              </span>
              {block.supplierActionRequired ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Supplier precisa responder
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Atualizar etapa</p>
              <Select
                value={draftStatus}
                onChange={(event) => setDraftStatus(event.currentTarget.value as WorkflowBlockStatus)}
              >
                {statusOptionsByBlock[block.key].map((status) => (
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
                onClick={() => onUpdateStatus(block.key, draftStatus)}
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
  );
}
