import {
  backofficeUserListFiltersSchema,
  type BackofficeUserListFilters,
  type BackofficeUserListStatusFilter,
} from "@registra/shared";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

const PAGE_SIZE = 10;

interface UseBackofficeUserListFiltersResult {
  filters: BackofficeUserListFilters;
  page: number;
  resetFilters: () => void;
  searchInput: string;
  setPage: Dispatch<SetStateAction<number>>;
  setSearchInput: Dispatch<SetStateAction<string>>;
  setStatusFilter: Dispatch<SetStateAction<BackofficeUserListStatusFilter>>;
  statusFilter: BackofficeUserListStatusFilter;
}

export function useBackofficeUserListFilters(): UseBackofficeUserListFiltersResult {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<BackofficeUserListStatusFilter>("all");
  const debouncedSearch = useDebouncedValue(searchInput, 250);

  const filters = useMemo(
    () =>
      backofficeUserListFiltersSchema.parse({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter,
      }),
    [debouncedSearch, page, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

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
