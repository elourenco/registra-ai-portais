import type { Buyer, Development, RegistrationProcess } from "@registra/shared";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@registra/ui";
import { useMemo } from "react";

import { StatusBadge } from "@/features/registration-core/components/status-badge";
import {
  formatCpf,
  processStatusLabels,
} from "@/features/registration-core/core/registration-presenters";

interface SupplierDevelopmentBuyersSheetProps {
  development: Development | null;
  buyers: Buyer[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  processes: RegistrationProcess[];
}

function resolveUnitLabel(buyer: Buyer, process?: RegistrationProcess): string {
  if (!process?.propertyLabel) {
    return "-";
  }

  const normalized = process.propertyLabel.trim();
  const buyerPrefix = `${buyer.name} - `;

  if (normalized.startsWith(buyerPrefix)) {
    return normalized.slice(buyerPrefix.length).trim();
  }

  return normalized;
}

export function SupplierDevelopmentBuyersSheet({
  development,
  buyers,
  onOpenChange,
  open,
  processes,
}: SupplierDevelopmentBuyersSheetProps) {
  const processMap = useMemo(() => new Map(processes.map((item) => [item.buyerId, item])), [processes]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-l border-border/70 p-0 sm:max-w-2xl">
        <div className="space-y-6">
          <SheetHeader className="border-b border-border/70 bg-background/95 px-6 py-5">
            <div className="space-y-1 pr-10">
              <SheetTitle>{development?.name ?? "Compradores do empreendimento"}</SheetTitle>
              <SheetDescription>
                {buyers.length} comprador(es) vinculados a este empreendimento no fluxo atual de registro.
              </SheetDescription>
            </div>
          </SheetHeader>

          <div className="px-6 pb-6">
            {buyers.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Nenhum comprador encontrado para este empreendimento.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/90">
                <div className="max-h-[70vh] overflow-auto">
                  <Table className="min-w-[760px]">
                    <TableHeader className="sticky top-0 z-10 bg-background">
                      <TableRow>
                        <TableHead>Comprador</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Etapa atual</TableHead>
                        <TableHead>Status do processo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {buyers.map((buyer) => {
                        const process = processMap.get(buyer.id);

                        return (
                          <TableRow key={buyer.id}>
                            <TableCell className="font-medium">{buyer.name}</TableCell>
                            <TableCell>{formatCpf(buyer.cpf)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>{buyer.email}</p>
                                <p className="text-muted-foreground">{buyer.phone}</p>
                              </div>
                            </TableCell>
                            <TableCell>{resolveUnitLabel(buyer, process)}</TableCell>
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
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
