import {
  normalizeCnpj,
  supplierStatusSchema,
  type SupplierStatus,
} from "@registra/shared";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { z } from "zod";

const PAGE_SIZE = 10;

const supplierListStatusFilterSchema = z.union([supplierStatusSchema, z.literal("all")]);

const supplierListFiltersSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  name: z
    .string()
    .trim()
    .transform((value) => value || undefined),
  cnpj: z
    .string()
    .trim()
    .transform((value) => {
      const normalizedValue = normalizeCnpj(value);
      return normalizedValue || undefined;
    }),
  status: supplierListStatusFilterSchema,
});

type SupplierListFilters = z.infer<typeof supplierListFiltersSchema>;
type SupplierListStatusFilter = SupplierStatus | "all";

interface UseSupplierListFiltersResult {
  applyFilters: () => void;
  cnpjInput: string;
  filters: SupplierListFilters;
  nameInput: string;
  page: number;
  resetFilters: () => void;
  setCnpjInput: Dispatch<SetStateAction<string>>;
  setNameInput: Dispatch<SetStateAction<string>>;
  setPage: Dispatch<SetStateAction<number>>;
  setStatusFilter: Dispatch<SetStateAction<SupplierListStatusFilter>>;
  statusFilter: SupplierListStatusFilter;
}

export function useSupplierListFilters(): UseSupplierListFiltersResult {
  const [page, setPage] = useState(1);
  const [nameInput, setNameInput] = useState("");
  const [cnpjInput, setCnpjInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupplierListStatusFilter>("all");
  const [appliedName, setAppliedName] = useState("");
  const [appliedCnpj, setAppliedCnpj] = useState("");
  const [appliedStatus, setAppliedStatus] = useState<SupplierListStatusFilter>("all");

  const filters = useMemo(
    () =>
      supplierListFiltersSchema.parse({
        page,
        limit: PAGE_SIZE,
        name: appliedName,
        cnpj: appliedCnpj,
        status: appliedStatus,
      }),
    [appliedCnpj, appliedName, appliedStatus, page],
  );

  const applyFilters = () => {
    setAppliedName(nameInput);
    setAppliedCnpj(cnpjInput);
    setAppliedStatus(statusFilter);
    setPage(1);
  };

  const resetFilters = () => {
    setNameInput("");
    setCnpjInput("");
    setStatusFilter("all");
    setAppliedName("");
    setAppliedCnpj("");
    setAppliedStatus("all");
    setPage(1);
  };

  return {
    applyFilters,
    cnpjInput,
    filters,
    nameInput,
    page,
    resetFilters,
    setCnpjInput,
    setNameInput,
    setPage,
    setStatusFilter,
    statusFilter,
  };
}
