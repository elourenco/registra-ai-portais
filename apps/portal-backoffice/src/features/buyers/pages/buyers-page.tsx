import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@registra/ui";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { StatusBadge } from "@/features/registration-core/components/status-badge";
import {
  formatCpf,
  processStatusLabels,
} from "@/features/registration-core/core/registration-presenters";
import { buildSupplierWorkspaceSidebar } from "@/features/registration-core/core/workspace-sidebar";
import { useRegistrationWorkspaceQuery } from "@/features/registration-core/hooks/use-registration-workspace-query";
import { routes } from "@/shared/constants/routes";
import { useRegisterPageHeader } from "@/shared/hooks/use-register-page-header";
import { useRegisterWorkspaceSidebar } from "@/shared/hooks/use-register-workspace-sidebar";

type BuyerBillingStatus = "pending" | "paid" | "waived";

function formatBillingPeriod(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function BuyersPage() {
  const navigate = useNavigate();
  const { developmentId, supplierId } = useParams<{ developmentId?: string; supplierId?: string }>();
  const workspaceQuery = useRegistrationWorkspaceQuery();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDevelopmentId, setSelectedDevelopmentId] = useState("");
  const developmentMap = new Map(workspaceQuery.data?.developments.map((item) => [item.id, item.name]) ?? []);
  const processMap = new Map(workspaceQuery.data?.processes.map((item) => [item.id, item]) ?? []);
  const supplier = useMemo(
    () => workspaceQuery.data?.suppliers.find((item) => item.id === supplierId) ?? null,
    [supplierId, workspaceQuery.data?.suppliers],
  );
  const development = useMemo(
    () =>
      workspaceQuery.data?.developments.find((item) =>
        developmentId ? item.id === developmentId : false,
      ) ?? null,
    [developmentId, workspaceQuery.data?.developments],
  );
  const workspaceSidebar = useMemo(() => {
    if (supplier) {
      return buildSupplierWorkspaceSidebar({
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierCnpj: supplier.cnpj,
      });
    }

    return null;
  }, [supplier]);
  const developments = useMemo(
    () =>
      [...(workspaceQuery.data?.developments ?? [])]
        .filter((item) => (supplierId ? item.supplierId === supplierId : true))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [supplierId, workspaceQuery.data?.developments],
  );
  const buyers = useMemo(
    () =>
      (workspaceQuery.data?.buyers ?? []).filter((buyer) => {
      if (supplierId && buyer.supplierId !== supplierId) {
        return false;
      }

      if (developmentId && buyer.developmentId !== developmentId) {
        return false;
      }

      return true;
    }).sort((left, right) => left.name.localeCompare(right.name)),
    [developmentId, supplierId, workspaceQuery.data?.buyers],
  );

  useRegisterWorkspaceSidebar(workspaceSidebar);
  useRegisterPageHeader(
    supplier
      ? {
          title: "Compradores",
          description: development ? "Compradores do empreendimento" : "Compradores do cliente",
          actions: [
            {
              label: "Cadastrar comprador",
              onClick: () => setIsCreateDialogOpen(true),
            },
          ],
          showNotifications: false,
        }
      : null,
  );

  const handleCreateBuyer = () => {
    if (!selectedDevelopmentId) {
      return;
    }

    setIsCreateDialogOpen(false);
    navigate(routes.developmentBuyerRegistrationById(selectedDevelopmentId));
  };

  return (
    <section className="space-y-6">
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <div>
            <CardTitle>Compradores cadastrados</CardTitle>
            <CardDescription>
              Tabela consolidada dos compradores vinculados ao contexto atual, com empreendimento,
              etapa do processo e responsável interno.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comprador</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Empreendimento</TableHead>
                <TableHead>Etapa atual</TableHead>
                <TableHead>Status do processo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buyers.map((item) => {
                const process = processMap.get(item.processId);
                const processUrl =
                  process && supplierId
                    ? routes.supplierDevelopmentBuyerProcessDetailById(
                        supplierId,
                        item.developmentId,
                        item.id,
                        process.id,
                      )
                    : process
                      ? routes.processDetailById(process.id)
                      : null;

                return (
                  <TableRow
                    key={item.id}
                    className={processUrl ? "cursor-pointer" : undefined}
                    onClick={() => {
                      if (processUrl) {
                        navigate(processUrl);
                      }
                    }}
                  >
                    <TableCell>
                      <span className="font-medium">{item.name}</span>
                    </TableCell>
                    <TableCell>{formatCpf(item.cpf)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{item.email}</p>
                        <p className="text-muted-foreground">{item.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplierId ? (
                        <Link
                          to={routes.supplierDevelopmentDetailById(supplierId, item.developmentId)}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {developmentMap.get(item.developmentId) ?? "-"}
                        </Link>
                      ) : (
                        developmentMap.get(item.developmentId) ?? "-"
                      )}
                    </TableCell>
                    <TableCell>{process?.currentStep ?? "-"}</TableCell>
                    <TableCell>
                      {process ? (
                        <StatusBadge
                          status={process.status}
                          label={processStatusLabels[process.status]}
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {buyers.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Nenhum comprador encontrado para este contexto.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setSelectedDevelopmentId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar empreendimento</DialogTitle>
            <DialogDescription>
              O cadastro do comprador é contextual ao empreendimento. Escolha onde o comprador será vinculado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="buyer-development" className="text-sm font-medium">
              Empreendimento
            </label>
            <Select
              id="buyer-development"
              value={selectedDevelopmentId}
              onChange={(event) => setSelectedDevelopmentId(event.target.value)}
            >
              <option value="">Selecione um empreendimento</option>
              {developments.map((development) => (
                <option key={development.id} value={development.id}>
                  {development.name}
                </option>
              ))}
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateBuyer} disabled={!selectedDevelopmentId}>
              Continuar cadastro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
