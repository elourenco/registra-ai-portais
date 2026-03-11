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
  buttonVariants,
} from "@registra/ui";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { StatusBadge } from "@/features/operations/components/status-badge";
import {
  billingStatusLabels,
  buyerStatusLabels,
  formatCpf,
} from "@/features/operations/core/operations-presenters";
import {
  buildDevelopmentWorkspaceSidebar,
  buildSupplierWorkspaceSidebar,
} from "@/features/operations/core/workspace-sidebar";
import { useOperationsWorkspaceQuery } from "@/features/operations/hooks/use-operations-workspace-query";
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
  const workspaceQuery = useOperationsWorkspaceQuery();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDevelopmentId, setSelectedDevelopmentId] = useState("");
  const [bulkBillingStatus, setBulkBillingStatus] = useState<BuyerBillingStatus>("paid");
  const [selectedBuyerIds, setSelectedBuyerIds] = useState<string[]>([]);
  const developmentMap = new Map(workspaceQuery.data?.developments.map((item) => [item.id, item.name]) ?? []);
  const processMap = new Map(workspaceQuery.data?.processes.map((item) => [item.id, item]) ?? []);
  const [billingStatusOverrides, setBillingStatusOverrides] = useState<Record<string, BuyerBillingStatus>>({});
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
    if (supplier && development) {
      return buildDevelopmentWorkspaceSidebar({
        supplierId: supplier.id,
        supplierName: supplier.name,
        developmentId: development.id,
        developmentName: development.name,
      });
    }

    if (supplier) {
      return buildSupplierWorkspaceSidebar({
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierCnpj: supplier.cnpj,
      });
    }

    return null;
  }, [development, supplier]);
  const developments = useMemo(
    () =>
      [...(workspaceQuery.data?.developments ?? [])]
        .filter((item) => (supplierId ? item.supplierId === supplierId : true))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [supplierId, workspaceQuery.data?.developments],
  );
  const buyerSections = useMemo(() => {
    const buyers = (workspaceQuery.data?.buyers ?? []).filter((buyer) => {
      if (supplierId && buyer.supplierId !== supplierId) {
        return false;
      }

      if (developmentId && buyer.developmentId !== developmentId) {
        return false;
      }

      return true;
    });
    const sectionsMap = new Map<
      string,
      {
        key: string;
        title: string;
        buyers: typeof buyers;
        sortDate: string;
      }
    >();

    buyers.forEach((buyer) => {
      const process = processMap.get(buyer.processId);
      if (!process) {
        return;
      }

      const sectionKey = new Date(process.createdAt).toISOString().slice(0, 7);
      const currentSection = sectionsMap.get(sectionKey);

      if (currentSection) {
        currentSection.buyers.push(buyer);
        return;
      }

      sectionsMap.set(sectionKey, {
        key: sectionKey,
        title: formatBillingPeriod(process.createdAt),
        buyers: [buyer],
        sortDate: process.createdAt,
      });
    });

    return [...sectionsMap.values()].sort((left, right) => right.sortDate.localeCompare(left.sortDate));
  }, [developmentId, processMap, supplierId, workspaceQuery.data?.buyers]);

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

  const handleToggleBuyer = (buyerId: string, checked: boolean) => {
    setSelectedBuyerIds((current) =>
      checked ? [...current, buyerId] : current.filter((currentBuyerId) => currentBuyerId !== buyerId),
    );
  };

  const handleToggleSection = (buyerIds: string[], checked: boolean) => {
    setSelectedBuyerIds((current) => {
      if (checked) {
        return Array.from(new Set([...current, ...buyerIds]));
      }

      return current.filter((buyerId) => !buyerIds.includes(buyerId));
    });
  };

  const applyBulkBillingStatus = () => {
    if (selectedBuyerIds.length === 0) {
      return;
    }

    setBillingStatusOverrides((current) => {
      const next = { ...current };
      selectedBuyerIds.forEach((buyerId) => {
        next[buyerId] = bulkBillingStatus;
      });
      return next;
    });
    setSelectedBuyerIds([]);
  };

  return (
    <section className="space-y-6">
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Ações em massa de cobrança</CardTitle>
            <CardDescription>
              Selecione compradores em qualquer competência mensal e aplique o status de pagamento em lote.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <label htmlFor="bulk-billing-status" className="text-sm font-medium">
                Atualizar status para
              </label>
              <Select
                id="bulk-billing-status"
                value={bulkBillingStatus}
                onChange={(event) => setBulkBillingStatus(event.currentTarget.value as BuyerBillingStatus)}
              >
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="waived">Isento</option>
              </Select>
            </div>
            <Button type="button" onClick={applyBulkBillingStatus} disabled={selectedBuyerIds.length === 0}>
              Aplicar em {selectedBuyerIds.length} comprador(es)
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {buyerSections.length === 0 ? (
          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nenhum comprador com processo ativo encontrado para cobrança mensal.
            </CardContent>
          </Card>
        ) : null}

        {buyerSections.map((section) => {
          const sectionBuyerIds = section.buyers.map((buyer) => buyer.id);
          const allSelected =
            sectionBuyerIds.length > 0 &&
            sectionBuyerIds.every((buyerId) => selectedBuyerIds.includes(buyerId));

          return (
            <Card key={section.key} className="border-border/70 bg-card/90 shadow-sm">
              <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>
                    Competência mensal de cobrança por comprador com processo ativo na operação.
                  </CardDescription>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(event) => handleToggleSection(sectionBuyerIds, event.currentTarget.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  Selecionar competência inteira
                </label>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Comprador</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Etapa atual</TableHead>
                      <TableHead>Status de pagamento</TableHead>
                      <TableHead className="text-right">Processo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {section.buyers.map((item) => {
                      const process = processMap.get(item.processId);
                      const billingStatus = billingStatusOverrides[item.id] ?? process?.billing.status ?? "pending";

                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedBuyerIds.includes(item.id)}
                              onChange={(event) => handleToggleBuyer(item.id, event.currentTarget.checked)}
                              className="h-4 w-4 rounded border-border"
                            />
                          </TableCell>
                          <TableCell>
                            <Link
                              to={
                                supplierId && item.developmentId
                                  ? routes.supplierDevelopmentBuyerDetailById(
                                      supplierId,
                                      item.developmentId,
                                      item.id,
                                    )
                                  : routes.buyerDetailById(item.id)
                              }
                              className="font-medium text-primary underline-offset-4 hover:underline"
                            >
                              {item.name}
                            </Link>
                          </TableCell>
                          <TableCell>{formatCpf(item.cpf)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{item.email}</p>
                              <p className="text-muted-foreground">{item.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>{developmentMap.get(item.developmentId) ?? "-"}</TableCell>
                          <TableCell>
                            <StatusBadge status={item.status} label={buyerStatusLabels[item.status]} />
                          </TableCell>
                          <TableCell>{process?.currentStep ?? "-"}</TableCell>
                          <TableCell>
                            <StatusBadge status={billingStatus} label={billingStatusLabels[billingStatus]} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              to={
                                supplierId && item.developmentId
                                  ? routes.supplierDevelopmentBuyerProcessDetailById(
                                      supplierId,
                                      item.developmentId,
                                      item.id,
                                      item.processId,
                                    )
                                  : routes.processDetailById(item.processId)
                              }
                              className={buttonVariants({ variant: "outline", size: "sm" })}
                            >
                              Abrir processo
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
