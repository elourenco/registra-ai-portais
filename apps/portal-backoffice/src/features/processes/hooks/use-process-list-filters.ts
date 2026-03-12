import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { z } from "zod";

import {
  processListStatusSchema,
  type ProcessListStatus,
} from "@/features/processes/core/process-schema";

const PAGE_SIZE = 10;

const processListStatusFilterSchema = z.union([processListStatusSchema, z.literal("all")]);

const processListFiltersSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  search: z
    .string()
    .trim()
    .transform((value) => value || undefined),
  status: processListStatusFilterSchema,
});

type ProcessListFilters = z.infer<typeof processListFiltersSchema>;
type ProcessListStatusFilter = ProcessListStatus | "all";

interface UseProcessListFiltersResult {
  filters: ProcessListFilters;
  page: number;
  resetFilters: () => void;
  searchInput: string;
  setPage: Dispatch<SetStateAction<number>>;
  setSearchInput: Dispatch<SetStateAction<string>>;
  setStatusFilter: Dispatch<SetStateAction<ProcessListStatusFilter>>;
  statusFilter: ProcessListStatusFilter;
}

export function useProcessListFilters(): UseProcessListFiltersResult {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProcessListStatusFilter>("all");

  const filters = useMemo(
    () =>
      processListFiltersSchema.parse({
        page,
        limit: PAGE_SIZE,
        search: searchInput,
        status: statusFilter,
      }),
    [page, searchInput, statusFilter],
  );

  const resetFilters = () => {
    setSearchInput("");
    setStatusFilter("all");
    setPage(1);
  };

  return {
    filters,
    page,
    resetFilters,
    searchInput,
    setPage,
    setSearchInput,
    setStatusFilter,
    statusFilter,
  };
}
