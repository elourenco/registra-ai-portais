import { dashboardFiltersSchema, getDashboardMeta, type DashboardTransaction } from "@registra/shared";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card";
import { Input } from "../components/input";
import { Select } from "../components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/table";
import type { TransactionsTableProps } from "./types";
import { useDebouncedValue } from "./use-debounced-value";

const dashboardMeta = getDashboardMeta();

const statusVariantMap = {
  paid: "success",
  pending: "warning",
  failed: "danger",
  refunded: "secondary",
} as const;

function toCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function toDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

function getLabel(key: string, source: Array<{ key: string; label: string }>): string {
  return source.find((item) => item.key === key)?.label ?? key;
}

function normalizeString(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function TransactionsTable({ onOpenTransaction, transactions }: TransactionsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 8 });
  const [searchInput, setSearchInput] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | DashboardTransaction["status"]>("all");
  const [selectedCategory, setSelectedCategory] = useState<"all" | DashboardTransaction["category"]>("all");

  const debouncedSearch = useDebouncedValue(searchInput, 250);

  const validatedFilters = useMemo(
    () =>
      dashboardFiltersSchema.parse({
        search: debouncedSearch,
        status: selectedStatus,
        category: selectedCategory,
      }),
    [debouncedSearch, selectedCategory, selectedStatus],
  );

  useEffect(() => {
    const nextColumnFilters: ColumnFiltersState = [];

    if (validatedFilters.status !== "all") {
      nextColumnFilters.push({
        id: "status",
        value: validatedFilters.status,
      });
    }

    if (validatedFilters.category !== "all") {
      nextColumnFilters.push({
        id: "category",
        value: validatedFilters.category,
      });
    }

    setColumnFilters(nextColumnFilters);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [validatedFilters.category, validatedFilters.status]);

  const columns = useMemo<ColumnDef<DashboardTransaction>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Data",
        sortingFn: (rowA, rowB, columnId) =>
          new Date(rowA.getValue<string>(columnId)).getTime() -
          new Date(rowB.getValue<string>(columnId)).getTime(),
        cell: ({ row }) => <span className="text-sm">{toDate(row.original.date)}</span>,
      },
      {
        accessorKey: "description",
        header: "Descrição",
        cell: ({ row }) => <span className="font-medium">{row.original.description}</span>,
      },
      {
        accessorKey: "category",
        header: "Categoria",
        filterFn: "equalsString",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {getLabel(row.original.category, dashboardMeta.categories)}
          </span>
        ),
      },
      {
        accessorKey: "method",
        header: "Método",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{getLabel(row.original.method, dashboardMeta.methods)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        filterFn: "equalsString",
        cell: ({ row }) => (
          <Badge variant={statusVariantMap[row.original.status]}>
            {getLabel(row.original.status, dashboardMeta.statuses)}
          </Badge>
        ),
      },
      {
        accessorKey: "value",
        header: "Valor",
        cell: ({ row }) => (
          <span className={row.original.value < 0 ? "font-semibold text-rose-600" : "font-semibold text-emerald-600"}>
            {toCurrency(row.original.value)}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: transactions,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter: validatedFilters.search,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = normalizeString(String(filterValue || ""));
      if (!query) {
        return true;
      }

      const values = [
        row.original.description,
        row.original.category,
        row.original.method,
        row.original.status,
        toCurrency(row.original.value),
      ];

      return values.some((value) => normalizeString(String(value)).includes(query));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const hasRows = table.getRowModel().rows.length > 0;

  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
          <div>
            <CardTitle className="text-xl">Pagamentos recentes</CardTitle>
            <CardDescription>Ordene, filtre e abra detalhes do histórico financeiro.</CardDescription>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.currentTarget.value)}
              placeholder="Buscar transações"
              className="h-9 sm:min-w-[220px]"
              aria-label="Buscar transações"
            />
            <Select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.currentTarget.value as "all" | DashboardTransaction["status"])
              }
              aria-label="Filtrar por status"
              className="h-9"
            >
              <option value="all">Status: Todos</option>
              {dashboardMeta.statuses.map((status) => (
                <option key={status.key} value={status.key}>
                  {status.label}
                </option>
              ))}
            </Select>
            <Select
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.currentTarget.value as "all" | DashboardTransaction["category"])
              }
              aria-label="Filtrar por categoria"
              className="h-9"
            >
              <option value="all">Categoria: Todas</option>
              {dashboardMeta.categories.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-left"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() ? <ArrowUpDown className="h-3.5 w-3.5" /> : null}
                        </button>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {hasRows ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() => onOpenTransaction(row.original)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpenTransaction(row.original);
                      }
                    }}
                    aria-label={`Abrir detalhes da transação ${row.original.description}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-14 text-center">
                    <p className="text-sm text-muted-foreground">Nenhuma transação encontrada.</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3"
                      onClick={() => {
                        setSearchInput("");
                        setSelectedStatus("all");
                        setSelectedCategory("all");
                      }}
                    >
                      Limpar filtros
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Próxima
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
