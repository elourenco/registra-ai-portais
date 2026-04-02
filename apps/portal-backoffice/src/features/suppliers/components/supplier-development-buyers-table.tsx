import type {
  SupplierDevelopmentBuyerSummary,
  SupplierDevelopmentProcessSummary,
} from "@registra/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@registra/ui";

import { formatCpf } from "@/features/registration-core/core/registration-presenters";

interface SupplierDevelopmentBuyersTableProps {
  buyers: SupplierDevelopmentBuyerSummary[];
  onOpenRow: (
    buyer: SupplierDevelopmentBuyerSummary,
    process: SupplierDevelopmentProcessSummary | undefined,
  ) => void;
  processesById: Map<string, SupplierDevelopmentProcessSummary>;
}

export function SupplierDevelopmentBuyersTable({
  buyers,
  onOpenRow,
  processesById,
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
              const process = buyer.processId ? processesById.get(buyer.processId) : undefined;

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
                  <TableCell>{buyer.unitLabel ?? "-"}</TableCell>
                  <TableCell>{process?.stageName ?? "-"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
