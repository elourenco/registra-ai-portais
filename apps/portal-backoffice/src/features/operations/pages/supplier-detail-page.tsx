import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  buttonVariants,
} from "@registra/ui";
import { Building2, Mail, Phone, UserCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/features/operations/components/page-header";
import { StatusBadge } from "@/features/operations/components/status-badge";
import {
  developmentStatusLabels,
  formatCnpj,
  supplierStatusLabels,
} from "@/features/operations/core/operations-presenters";
import { useSupplierProfileQuery } from "@/features/operations/hooks/use-supplier-profile-query";
import { useUpdateSupplierStatus } from "@/features/operations/hooks/use-update-supplier-status";
import { routes } from "@/shared/constants/routes";

export function SupplierDetailPage() {
  const { buyersCount, developments, processesCount, supplier, supplierId, workspaceQuery } =
    useSupplierProfileQuery();
  const updateSupplierStatus = useUpdateSupplierStatus();
  const [isEditSheetOpen, setEditSheetOpen] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [supplierCnpj, setSupplierCnpj] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"active" | "onboarding" | "inactive" | "blocked">("active");
  const [selectedReason, setSelectedReason] = useState<"payment" | "manual">("manual");

  useEffect(() => {
    if (!supplier) {
      return;
    }

    setSupplierName(supplier.name);
    setSupplierCnpj(supplier.cnpj);
    setContactName(supplier.contactName);
    setContactEmail(supplier.contactEmail);
    setContactPhone(supplier.contactPhone);
    setSelectedStatus(supplier.status);
    setSelectedReason(supplier.statusReason ?? "manual");
  }, [supplier]);

  if (!supplierId) {
    return (
      <Card className="border-rose-200 bg-rose-50/70">
        <CardContent className="p-6">
          <p className="font-medium text-rose-700">Cliente inválido.</p>
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

  if (!supplier) {
    return (
      <Card className="border-rose-200 bg-rose-50/70">
        <CardContent className="space-y-3 p-6">
          <p className="font-medium text-rose-700">Cliente não encontrado.</p>
          <Link to={routes.suppliers} className={buttonVariants({ variant: "outline" })}>
            Voltar para clientes
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title={supplier.name}
        description="Detalhe operacional do cliente com informações cadastrais e empreendimentos vinculados."
        actions={
          <>
            <Link to={routes.suppliers} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Voltar para clientes
            </Link>
            <Button type="button" size="sm" onClick={() => setEditSheetOpen(true)}>
              Editar cliente
            </Button>
          </>
        }
      />

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl">{supplier.name}</CardTitle>
                <StatusBadge status={supplier.status} label={supplierStatusLabels[supplier.status]} />
              </div>
              <CardDescription>Cliente com checkpoints obrigatórios em processos de registro.</CardDescription>
              {supplier.status === "blocked" && supplier.statusReason === "payment" ? (
                <p className="text-sm font-medium text-rose-700">
                  Cliente bloqueado por pagamento. Todos os compradores vinculados ficam bloqueados por este motivo.
                </p>
              ) : null}
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
              <p className="font-medium">CNPJ</p>
              <p className="text-muted-foreground">{formatCnpj(supplier.cnpj)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border p-4">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <UserCircle2 className="h-3.5 w-3.5" />
              Contato principal
            </p>
            <p className="mt-2 font-medium">{supplier.contactName}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              E-mail
            </p>
            <p className="mt-2 font-medium">{supplier.contactEmail}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              Telefone
            </p>
            <p className="mt-2 font-medium">{supplier.contactPhone}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              Volume operacional
            </p>
            <p className="mt-2 font-medium">{developments.length} empreendimentos</p>
            <p className="text-sm text-muted-foreground">{buyersCount} compradores · {processesCount} processos</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Empreendimentos cadastrados</CardTitle>
          <CardDescription>Todos os empreendimentos do cliente, clicáveis e conectados ao restante da operação.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empreendimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Compradores</TableHead>
                <TableHead className="text-right">Navegação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {developments.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link to={routes.developmentDetailById(item.id)} className="font-medium text-primary underline-offset-4 hover:underline">
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} label={developmentStatusLabels[item.status]} />
                  </TableCell>
                  <TableCell>{item.address}</TableCell>
                  <TableCell>{item.buyersCount}</TableCell>
                  <TableCell className="text-right">
                    <Link to={routes.developmentDetailById(item.id)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Abrir empreendimento
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {developments.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Nenhum empreendimento cadastrado para este cliente.</div>
          ) : null}
        </CardContent>
      </Card>
      <Sheet open={isEditSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>Editar cliente</SheetTitle>
              <SheetDescription>
                Atualize os dados cadastrais e o status operacional do cliente. Se o bloqueio for por pagamento, os compradores deste cliente serão bloqueados automaticamente.
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="supplier-name">Nome do cliente</Label>
                <Input id="supplier-name" value={supplierName} onChange={(event) => setSupplierName(event.currentTarget.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-cnpj">CNPJ</Label>
                <Input id="supplier-cnpj" value={supplierCnpj} onChange={(event) => setSupplierCnpj(event.currentTarget.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-contact-name">Contato principal</Label>
                <Input
                  id="supplier-contact-name"
                  value={contactName}
                  onChange={(event) => setContactName(event.currentTarget.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-contact-email">E-mail</Label>
                <Input
                  id="supplier-contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.currentTarget.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-contact-phone">Telefone</Label>
                <Input
                  id="supplier-contact-phone"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.currentTarget.value)}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border/70 p-4">
              <div>
                <h3 className="text-sm font-semibold">Status operacional</h3>
                <p className="text-sm text-muted-foreground">
                  Controle o acesso do cliente e o impacto operacional sobre os compradores vinculados.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier-status">Status</Label>
                <Select
                  id="supplier-status"
                  value={selectedStatus}
                  onChange={(event) =>
                    setSelectedStatus(event.currentTarget.value as "active" | "onboarding" | "inactive" | "blocked")
                  }
                >
                  <option value="active">Ativo</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="inactive">Inativo</option>
                  <option value="blocked">Bloqueado</option>
                </Select>
              </div>

              {selectedStatus === "blocked" ? (
                <div className="space-y-2">
                  <Label htmlFor="supplier-status-reason">Motivo do bloqueio</Label>
                  <Select
                    id="supplier-status-reason"
                    value={selectedReason}
                    onChange={(event) => setSelectedReason(event.currentTarget.value as "payment" | "manual")}
                  >
                    <option value="payment">Pagamento</option>
                    <option value="manual">Bloqueio manual</option>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Quando o motivo for pagamento, os compradores dos empreendimentos deste cliente ficam bloqueados por pagamento.
                  </p>
                </div>
              ) : null}
            </div>

            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setEditSheetOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!supplierId) {
                    return;
                  }

                  updateSupplierStatus({
                    supplierId,
                    name: supplierName,
                    cnpj: supplierCnpj,
                    contactName,
                    contactEmail,
                    contactPhone,
                    status: selectedStatus,
                    reason: selectedStatus === "blocked" ? selectedReason : null,
                  });
                  setEditSheetOpen(false);
                }}
              >
                Salvar cliente
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
