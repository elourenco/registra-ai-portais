import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EyeIcon,
  FileTextIcon,
  TrashIcon,
} from "@registra/ui";

import type { BuyerDocument } from "../buyer-onboarding.types";
import { UploadField } from "./upload-field";

interface DocumentCardProps {
  document: BuyerDocument;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

const statusConfig = {
  pending: { label: "Pendente", variant: "outline" as const },
  uploaded: { label: "Anexado", variant: "success" as const },
  approved: { label: "Aprovado", variant: "success" as const },
  rejected: { label: "Rejeitado", variant: "danger" as const },
};

function formatFileMetadata(fileType: string | null, fileSizeKb: number | null) {
  const normalizedType =
    fileType?.includes("/")
      ? fileType.split("/").pop()?.toUpperCase()
      : fileType?.toUpperCase() ?? "ARQUIVO";

  if (!fileSizeKb) {
    return normalizedType ?? "ARQUIVO";
  }

  return `${normalizedType} · ${fileSizeKb} KB`;
}

export function DocumentCard({ document, onUpload, onRemove }: DocumentCardProps) {
  const status = statusConfig[document.status];

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{document.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {document.owner === "buyer"
                ? "Documento do comprador"
                : document.owner === "spouse"
                  ? "Documento do cônjuge"
                  : "Documento gerado pelo backoffice"}
            </p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {document.rejectionReason ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Motivo da rejeição: {document.rejectionReason}
          </div>
        ) : null}

        {document.status === "pending" || document.status === "rejected" ? (
          <UploadField
            label={document.status === "rejected" ? "Reenviar documento" : "Enviar documento"}
            onFileSelect={onUpload}
          />
        ) : (
          <Dialog>
            <div className="rounded-lg border border-border/70 px-3 py-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <FileTextIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">{document.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {document.status === "approved"
                        ? `Validado · ${formatFileMetadata(document.fileType, document.fileSizeKb)}`
                        : formatFileMetadata(document.fileType, document.fileSizeKb)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="icon" aria-label="Visualizar documento">
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Excluir documento"
                    className="text-destructive hover:text-destructive"
                    onClick={onRemove}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{document.title}</DialogTitle>
                <DialogDescription>
                  Pré-visualização simulada do documento enviado pelo comprador.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                {document.fileName ?? "Documento sem arquivo"}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
