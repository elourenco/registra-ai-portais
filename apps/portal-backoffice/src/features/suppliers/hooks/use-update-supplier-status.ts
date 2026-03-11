import type { Buyer, OperationsWorkspace, RegistrationSupplierStatus } from "@registra/shared";
import { useQueryClient } from "@tanstack/react-query";

type SupplierStatusReason = "payment" | "manual" | null;

interface UpdateSupplierStatusInput {
  supplierId: string;
  name: string;
  cnpj: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: RegistrationSupplierStatus;
  reason: SupplierStatusReason;
}

function updateBuyerForSupplierStatus(
  buyer: Buyer,
  supplierId: string,
  status: RegistrationSupplierStatus,
  reason: SupplierStatusReason,
): Buyer {
  if (buyer.supplierId !== supplierId) {
    return buyer;
  }

  if (status === "blocked" && reason === "payment") {
    return {
      ...buyer,
      status: "blocked",
      statusReason: "supplier_payment",
    };
  }

  if (buyer.statusReason === "supplier_payment") {
    return {
      ...buyer,
      status: "active",
      statusReason: null,
    };
  }

  return buyer;
}

export function useUpdateSupplierStatus() {
  const queryClient = useQueryClient();

  return ({
    supplierId,
    name,
    cnpj,
    contactName,
    contactEmail,
    contactPhone,
    status,
    reason,
  }: UpdateSupplierStatusInput) => {
    queryClient.setQueryData<OperationsWorkspace>(["operations", "workspace"], (current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        suppliers: current.suppliers.map((supplier) =>
          supplier.id === supplierId
            ? {
                ...supplier,
                name,
                cnpj,
                contactName,
                contactEmail,
                contactPhone,
                status,
                statusReason: reason,
              }
            : supplier,
        ),
        buyers: current.buyers.map((buyer) => updateBuyerForSupplierStatus(buyer, supplierId, status, reason)),
      };
    });

    queryClient.invalidateQueries({ queryKey: ["operations", "dashboard"] });
  };
}
