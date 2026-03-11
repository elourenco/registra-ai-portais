import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  buttonVariants,
} from "@registra/ui";
import { Building2, GitBranch, MapPin, UserCircle2 } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/features/operations/components/page-header";
import { StatusBadge } from "@/features/operations/components/status-badge";
import {
  buyerStatusLabels,
  developmentStatusLabels,
  formatCnpj,
  processStatusLabels,
} from "@/features/operations/core/operations-presenters";
import { useDevelopmentDetailQuery } from "@/features/operations/hooks/use-development-detail-query";
import { routes } from "@/shared/constants/routes";

export function DevelopmentDetailPage() {
  const { buyers, development, developmentId, processes, supplier, workspaceQuery } =
    useDevelopmentDetailQuery();
  const processMap = useMemo(() => new Map(processes.map((item) => [item.id, item])), [processes]);

  if (!developmentId) {
    return (
      <Card className="border-rose-200 bg-rose-50/70">
        <CardContent className="p-6">
          <p className="font-medium text-rose-700">Empreendimento inválido.</p>
        </CardContent>
      </Card>
    );
  }

  if (workspaceQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  if (!development) {
    return (
      <Card className="border-rose-200 bg-rose-50/70">
        <CardContent className="space-y-3 p-6">
          <p className="font-medium text-rose-700">Empreendimento não encontrado.</p>
          <Link to={routes.developments} className={buttonVariants({ variant: "outline" })}>
            Voltar para empreendimentos
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title={development.name}
        description="Resumo do empreendimento com cliente vinculado, compradores e processos navegáveis."
        actions={
          <>
            <Link to={routes.developments} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Voltar para empreendimentos
            </Link>
            <Link
              to={routes.developmentBuyerRegistrationById(development.id)}
              className={buttonVariants({ size: "sm" })}
            >
              Cadastrar comprador
            </Link>
          </>
        }
      />

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl">{development.name}</CardTitle>
                <StatusBadge status={development.status} label={developmentStatusLabels[development.status]} />
              </div>
              <CardDescription>
                {supplier ? (
                  <>
                    Cliente:{" "}
                    <Link to={routes.supplierDetailById(supplier.id)} className="font-medium text-primary underline-offset-4 hover:underline">
                      {supplier.name}
                    </Link>
                  </>
                ) : (
                  "Cliente não encontrado"
                )}
              </CardDescription>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
              <p className="font-medium">CNPJ do empreendimento</p>
              <p className="text-muted-foreground">{formatCnpj(development.cnpj)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Endereço
            </p>
            <p className="mt-2 font-medium">{development.address}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <UserCircle2 className="h-3.5 w-3.5" />
              Compradores
            </p>
            <p className="mt-2 font-medium">{buyers.length}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <GitBranch className="h-3.5 w-3.5" />
              Processos
            </p>
            <p className="mt-2 font-medium">{processes.length}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Registro dos compradores vinculados</CardTitle>
          <CardDescription>
            Visão única do conteúdo do registro, reunindo comprador, imóvel, matrícula e andamento do processo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comprador</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status do comprador</TableHead>
                <TableHead>Imóvel</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Status do processo</TableHead>
                <TableHead>Etapa atual</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buyers.map((buyer) => {
                const process = processMap.get(buyer.processId);

                return (
                  <TableRow key={buyer.id}>
                    <TableCell>
                      <Link
                        to={routes.buyerDetailById(buyer.id)}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {buyer.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{buyer.email}</p>
                        <p className="text-muted-foreground">{buyer.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <StatusBadge status={buyer.status} label={buyerStatusLabels[buyer.status]} />
                        {buyer.status === "blocked" && buyer.statusReason === "supplier_payment" ? (
                          <p className="text-xs text-rose-700">Bloqueado por inadimplência do cliente.</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {process ? (
                        <Link
                          to={routes.processDetailById(process.id)}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {process.propertyLabel}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{process?.registrationNumber ?? "-"}</TableCell>
                    <TableCell>
                      {process ? (
                        <StatusBadge status={process.status} label={processStatusLabels[process.status]} />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{process?.currentStep ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {process ? (
                        <Link
                          to={routes.processDetailById(process.id)}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Abrir processo
                        </Link>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <p className="font-medium">Navegação hierárquica</p>
            <p className="text-sm text-muted-foreground">Cliente → Empreendimento → Comprador → Processo</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {supplier ? (
              <Link to={routes.supplierDetailById(supplier.id)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Building2 className="mr-2 h-4 w-4" />
                Cliente
              </Link>
            ) : null}
            <Link to={routes.processes} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <GitBranch className="mr-2 h-4 w-4" />
              Processos
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
