import type { Buyer, RegistrationProcess } from "@registra/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@registra/ui";

import { formatCpf } from "@/features/registration-core/core/registration-presenters";

interface SupplierDevelopmentBuyersTableProps {
  buyers: Buyer[];
  onOpenRow: (buyer: Buyer, process: RegistrationProcess | undefined) => void;
  processesByBuyerId: Map<string, RegistrationProcess>;
}

export function SupplierDevelopmentBuyersTable({
  buyers,
  onOpenRow,
  processesByBuyerId,
}: SupplierDevelopmentBuyersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card/90 shadow-sm">
      <div className="overflow-x-auto">
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow>
              <TableHead>Comprador</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Etapa atual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buyers.map((buyer) => {
              const process = processesByBuyerId.get(buyer.id);

              return (
                <TableRow
                  key={buyer.id}
                  className="cursor-pointer"
                  onClick={() => onOpenRow(buyer, process)}
                >
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium text-foreground">{buyer.name}</p>
                      <p className="text-muted-foreground">{formatCpf(buyer.cpf)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{buyer.email}</p>
                      <p className="text-muted-foreground">{buyer.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>{process?.propertyLabel ?? "-"}</TableCell>
                  <TableCell>{process?.currentStep ?? "-"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
