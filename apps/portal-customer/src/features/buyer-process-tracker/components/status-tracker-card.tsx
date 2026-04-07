import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CircleCheckBigIcon,
  CircleDotIcon,
  Clock3Icon,
  Separator,
  Progress,
  FileTextIcon,
  UploadCloudIcon,
} from "@registra/ui";

import type { BuyerProcessDocument } from "@registra/shared";

import type {
  BuyerProcessTrackerTimelineStage,
  BuyerProcessTrackerViewModel,
} from "../core/buyer-process-tracker-view-model";

interface StatusTrackerCardProps extends BuyerProcessTrackerViewModel {
  isRefreshing: boolean;
  refreshErrorMessage: string | null;
  onResolveNow: () => void;
}

const topStatusMap = {
  in_progress: { label: "Em andamento", variant: "outline" as const },
  in_review: { label: "Em análise", variant: "secondary" as const },
  waiting_user: { label: "Aguardando você", variant: "warning" as const },
  completed: { label: "Concluído", variant: "success" as const },
};

function StageIcon({ stage }: { stage: BuyerProcessTrackerTimelineStage }) {
  if (stage.status === "completed") {
    return <CircleCheckBigIcon className="h-4 w-4" />;
  }

  if (stage.status === "in_progress") {
    return <CircleDotIcon className="h-4 w-4" />;
  }

  return <Clock3Icon className="h-4 w-4" />;
}

function DocumentStatusBadge({ status }: { status: BuyerProcessDocument["status"] }) {
  switch (status) {
    case "approved":
      return <Badge variant="success">Aprovado</Badge>;
    case "rejected":
      return <Badge variant="danger">Reprovado</Badge>;
    case "under_review":
      return <Badge variant="secondary">Em análise</Badge>;
    case "replaced":
      return <Badge variant="outline">Substituído</Badge>;
    case "uploaded":
      return <Badge variant="outline">Enviado</Badge>;
    default:
      return <Badge variant="outline">Pendente</Badge>;
  }
}

export function StatusTrackerCard({
  status,
  timeline,
  documents,
  pendingAction,
  isRefreshing,
  refreshErrorMessage,
  onResolveNow,
}: StatusTrackerCardProps) {
  const topStatus = topStatusMap[status];

  const totalStages = timeline.length || 1;
  const completedStagesCount = timeline.filter((s) => s.status === "completed").length;
  const progressValue = (completedStagesCount / totalStages) * 100;

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Badge variant={topStatus.variant}>{topStatus.label}</Badge>
            <p className="text-sm text-muted-foreground">
              {isRefreshing ? "Atualizando andamento..." : "Acompanhamento do seu processo"}
            </p>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl">
              Informações e documentação enviadas com sucesso
            </CardTitle>
            <CardDescription>
              {pendingAction
                ? "Há uma pendência sua para o processo seguir em frente."
                : status === "completed"
                  ? "Seu processo foi concluído com sucesso."
                  : "Estamos cuidando do seu processo e atualizaremos cada avanço por aqui."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-foreground">
            {pendingAction
              ? "Falta apenas 1 passo para concluir a etapa atual."
              : status === "in_review"
                ? "Seu processo está em análise."
                : "A jornada segue normalmente sem ação sua neste momento."}
          </div>
          {refreshErrorMessage ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {refreshErrorMessage}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Timeline do processo</CardTitle>
          <CardDescription>Certificado, contrato e registro em uma visão objetiva.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Avanço</span>
              <span className="text-muted-foreground">{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
          {timeline.map((stage, index) => (
            <div key={stage.id} className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <StageIcon stage={stage} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{stage.title}</p>
                    <Badge
                      variant={
                        stage.status === "completed"
                          ? "success"
                          : stage.status === "in_progress"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {stage.status === "completed"
                        ? "Concluído"
                        : stage.status === "in_progress"
                          ? "Em andamento"
                          : "Pendente"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{stage.description}</p>
                </div>
              </div>
              {index < timeline.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Documentos do Processo</CardTitle>
          <CardDescription>Acompanhe os arquivos enviados para o seu processo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="shrink-0 rounded-full bg-muted flex items-center justify-center p-2">
                    <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">{doc.title}</p>
                    <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                      <DocumentStatusBadge status={doc.status} />
                      {doc.rejectionReason && doc.status === "rejected" && (
                        <span className="text-destructive font-medium line-clamp-1">
                          {doc.rejectionReason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {(doc.status === "rejected" || doc.status === "replaced") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto shrink-0"
                    onClick={onResolveNow}
                  >
                    <UploadCloudIcon className="mr-2 h-4 w-4" />
                    {doc.status === "replaced" ? "Substituir" : "Enviar Novamente"}
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-4 text-center text-sm text-muted-foreground">
              Nenhum documento disponível para acompanhamento.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>
            {pendingAction ? "Você precisa agir agora" : "Nenhuma ação pendente"}
          </CardTitle>
          <CardDescription>
            {pendingAction
              ? "Existe uma pendência para o comprador resolver antes da análise continuar."
              : "Estamos cuidando do seu processo."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingAction ? (
            <Button type="button" className="w-full sm:w-fit" onClick={onResolveNow}>
              Resolver agora
            </Button>
          ) : (
            <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              Estamos cuidando do seu processo.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
