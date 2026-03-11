import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  buttonVariants,
} from "@registra/ui";
import type { RegistrationProcess } from "@registra/shared";
import { ArrowRight, Building2, FolderKanban, GitBranch, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { StatusBadge } from "@/features/registration-core/components/status-badge";
import {
  formatDate,
  processStatusLabels,
} from "@/features/registration-core/core/registration-presenters";
import { routes } from "@/shared/constants/routes";

interface DrawerItem {
  process: RegistrationProcess;
  supplierName: string;
  developmentName: string;
  buyerName: string;
  reason: string;
}

interface DashboardContractsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  navigationLabel: string;
  navigationTo: string;
  items: DrawerItem[];
}

export function DashboardContractsDrawer({
  open,
  onOpenChange,
  title,
  description,
  navigationLabel,
  navigationTo,
  items,
}: DashboardContractsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-l border-border/70 p-0 sm:max-w-2xl">
        <div className="flex min-h-full flex-col">
          <SheetHeader className="border-b border-border/70 bg-background/95 px-6 py-5">
            <div className="flex items-start justify-between gap-4 pr-8">
              <div className="space-y-2">
                <SheetTitle className="text-2xl">{title}</SheetTitle>
                <SheetDescription className="max-w-xl">{description}</SheetDescription>
              </div>
              <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
                {items.length} contrato(s)
              </span>
            </div>
          </SheetHeader>

          <div className="border-b border-border/70 px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link to={navigationTo} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Ir para {navigationLabel}
              </Link>
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Fechar painel
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-4 px-6 py-5">
            {items.length > 0 ? (
              items.map(({ process, supplierName, developmentName, buyerName, reason }) => (
                <article key={process.id} className="rounded-2xl border border-border/70 bg-card/70 p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold">{process.propertyLabel}</p>
                        <StatusBadge status={process.status} label={processStatusLabels[process.status]} />
                      </div>
                      <p className="text-sm text-muted-foreground">{reason}</p>
                    </div>
                    <Link
                      to={routes.processDetailById(process.id)}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Abrir processo
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-xl border border-border/70 bg-background/70 p-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        Cliente
                      </p>
                      <p className="text-sm font-medium">{supplierName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        <FolderKanban className="h-3.5 w-3.5" />
                        Empreendimento
                      </p>
                      <p className="text-sm font-medium">{developmentName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        <UserCircle2 className="h-3.5 w-3.5" />
                        Comprador
                      </p>
                      <p className="text-sm font-medium">{buyerName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        <GitBranch className="h-3.5 w-3.5" />
                        Fluxo
                      </p>
                      <p className="text-sm font-medium">{process.currentStep}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Matrícula {process.registrationNumber}</span>
                    <span>Prazo {formatDate(process.dueAt)}</span>
                    <Link to={routes.processDetailById(process.id)} className="inline-flex items-center gap-1 font-medium text-primary">
                      Navegar para o detalhe
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-8 text-sm text-muted-foreground">
                Nenhum contrato relacionado a este indicador.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
