import {
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
} from "@registra/ui";
import {
  Download,
  FileText,
  FolderKanban,
  GitBranch,
  Mail,
  Phone,
  UserCircle2,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { StatusBadge } from "@/features/operations/components/status-badge";
import {
  blockTitleLabels,
  buyerStatusLabels,
  documentStatusLabels,
  documentTypeLabels,
  documentUploadedByLabels,
  formatCpf,
  formatDateTime,
  processStatusLabels,
  requestStatusLabels,
} from "@/features/operations/core/operations-presenters";
import { buildSupplierWorkspaceSidebar } from "@/features/operations/core/workspace-sidebar";
import { useBuyerDetailQuery } from "@/features/operations/hooks/use-buyer-detail-query";
import { routes } from "@/shared/constants/routes";
import { useRegisterPageHeader } from "@/shared/hooks/use-register-page-header";
import { useRegisterWorkspaceSidebar } from "@/shared/hooks/use-register-workspace-sidebar";

function downloadMockFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName.endsWith(".txt") ? fileName : `${fileName}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function BuyerDetailPage() {
  const { buyer, buyerId, development, process, processDetailQuery, supplier, workspaceQuery } =
    useBuyerDetailQuery();
  const workspaceSidebar = useMemo(() => {
    if (!buyer || !supplier || !development) {
      return null;
    }

    return buildSupplierWorkspaceSidebar({
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierCnpj: supplier.cnpj,
    });
  }, [buyer, development, supplier]);

  useRegisterWorkspaceSidebar(workspaceSidebar);
  useRegisterPageHeader(
    buyer
      ? {
          title: buyer.name,
          description: formatCpf(buyer.cpf),
          actions: process
            ? [
                {
                  label: "Abrir processo",
                  to:
                    supplier && development
                      ? routes.supplierDevelopmentBuyerProcessDetailById(
                          supplier.id,
                          development.id,
                          buyer.id,
                          process.id,
                        )
                      : routes.processDetailById(process.id),
                  variant: "outline",
                },
              ]
            : [],
          showNotifications: false,
        }
      : null,
  );

  if (!buyerId) {
    return (
      <Card className="border-rose-200 bg-rose-50/70">
        <CardContent className="p-6">
          <p className="font-medium text-rose-700">Comprador inválido.</p>
        </CardContent>
      </Card>
    );
  }

  if (workspaceQuery.isPending || processDetailQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (
    !buyer ||
    !process ||
    !development ||
    !supplier ||
    processDetailQuery.isError ||
    !processDetailQuery.data
  ) {
    return (
      <Card className="border-rose-200 bg-rose-50/70">
        <CardContent className="space-y-3 p-6">
          <p className="font-medium text-rose-700">
            Não foi possível carregar a interna do comprador.
          </p>
          <Link to={routes.buyers} className={buttonVariants({ variant: "outline" })}>
            Voltar para compradores
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { documents, requests } = processDetailQuery.data;
  const responseRequests = requests.filter(
    (item) => item.status !== "created" && item.status !== "sent",
  );
  const submittedDocuments = documents.filter((item) => item.uploadedBy !== "backoffice");

  return (
    <section className="space-y-6">
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl">{buyer.name}</CardTitle>
                <StatusBadge status={buyer.status} label={buyerStatusLabels[buyer.status]} />
              </div>
              <CardDescription>
                Cliente{" "}
                <Link
                  to={routes.supplierDetailById(supplier.id)}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {supplier.name}
                </Link>
                {" · "}
                Empreendimento{" "}
                <Link
                  to={routes.supplierDevelopmentDetailById(supplier.id, development.id)}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {development.name}
                </Link>
              </CardDescription>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
              <p className="font-medium">CPF</p>
              <p className="text-muted-foreground">{formatCpf(buyer.cpf)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border p-4">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              E-mail
            </p>
            <p className="mt-2 font-medium">{buyer.email}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              Telefone
            </p>
            <p className="mt-2 font-medium">{buyer.phone}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <FolderKanban className="h-3.5 w-3.5" />
              Empreendimento
            </p>
            <p className="mt-2 font-medium">{development.name}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <GitBranch className="h-3.5 w-3.5" />
              Processo vinculado
            </p>
            <p className="mt-2 font-medium">{process.propertyLabel}</p>
            <div className="mt-2">
              <StatusBadge status={process.status} label={processStatusLabels[process.status]} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Informações respondidas</CardTitle>
          <CardDescription>
            Exibe as devolutivas recebidas do comprador ou do cliente ao longo das solicitações do
            processo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {responseRequests.length > 0 ? (
            responseRequests.map((request) => (
              <article key={request.id} className="rounded-xl border border-border/70 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    status={request.status}
                    label={requestStatusLabels[request.status]}
                  />
                  <span className="text-xs text-muted-foreground">
                    {blockTitleLabels[request.block]}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium">{request.description}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Documentos solicitados: {request.requiredDocuments.join(", ")}
                </p>
                <div className="mt-3 grid gap-3 text-xs text-muted-foreground md:grid-cols-3">
                  <p>Enviado em {formatDateTime(request.sentAt)}</p>
                  <p>
                    {request.respondedAt
                      ? `Respondido em ${formatDateTime(request.respondedAt)}`
                      : "Resposta em validação"}
                  </p>
                  <p>Processo {process.id}</p>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
              Ainda não há respostas registradas para este comprador.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Arquivos enviados para análise</CardTitle>
          <CardDescription>
            Visualize os documentos recebidos da parte externa e faça o download do arquivo enviado
            quando necessário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {submittedDocuments.length > 0 ? (
            submittedDocuments.map((document) => (
              <article key={document.id} className="rounded-xl border border-border/70 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <p className="font-medium">{document.name}</p>
                      <StatusBadge
                        status={document.status}
                        label={documentStatusLabels[document.status]}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {documentTypeLabels[document.type]} · {blockTitleLabels[document.block]} ·
                      enviado em {formatDateTime(document.uploadedAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Enviado por {documentUploadedByLabels[document.uploadedBy]} · versão{" "}
                      {document.version}
                    </p>
                    <Separator />
                    <p className="text-sm text-muted-foreground">
                      Processo relacionado: {process.propertyLabel} · Matrícula{" "}
                      {process.registrationNumber}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadMockFile(
                        document.name,
                        [
                          `Arquivo enviado: ${document.name}`,
                          `Comprador: ${buyer.name}`,
                          `Cliente: ${supplier.name}`,
                          `Empreendimento: ${development.name}`,
                          `Bloco: ${blockTitleLabels[document.block]}`,
                          `Tipo: ${documentTypeLabels[document.type]}`,
                          `Status: ${documentStatusLabels[document.status]}`,
                          `Data de envio: ${formatDateTime(document.uploadedAt)}`,
                        ].join("\n"),
                      )
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar arquivo
                  </Button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
              Nenhum arquivo enviado para análise foi encontrado neste processo.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <p className="font-medium">Navegação relacionada</p>
            <p className="text-sm text-muted-foreground">
              Comprador → Processo → Validação de respostas e documentos
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={routes.supplierDevelopmentBuyerProcessDetailById(
                supplier.id,
                development.id,
                buyer.id,
                process.id,
              )}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <GitBranch className="mr-2 h-4 w-4" />
              Processo
            </Link>
            <Link
              to={routes.supplierDevelopmentDetailById(supplier.id, development.id)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <UserCircle2 className="mr-2 h-4 w-4" />
              Empreendimento
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
