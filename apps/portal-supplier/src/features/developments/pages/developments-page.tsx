import {
  Button,
  Building2Icon,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  CircleHelpIcon,
  SearchIcon,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@registra/ui";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useDevelopmentsQuery } from "@/features/developments/hooks/use-development-queries";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { routes } from "@/shared/constants/routes";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

export function DevelopmentsPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const developmentsQuery = useDevelopmentsQuery(debouncedSearch);
  const items = developmentsQuery.data?.items ?? [];
  const metrics = useMemo(
    () => ({
      total: items.length,
      active: items.filter((item) => item.status === "drafting").length,
      launching: items.filter((item) => item.status === "commercialization").length,
      pending: items.filter((item) => item.status === "registry").length,
      buyers: items.reduce((total, item) => total + item.buyersCount, 0),
    }),
    [items],
  );

  return (
    <section className="space-y-6">
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="space-y-1">
              <CardTitle className="text-3xl tracking-tight">Empreendimentos</CardTitle>
              <CardDescription>
                Carteira do supplier com visão direta de status, volumetria comercial e acesso rápido ao detalhe.
              </CardDescription>
            </div>
          </div>
          <Button type="button" onClick={() => navigate(routes.developmentCreate)}>
            Cadastrar empreendimento
          </Button>
        </CardHeader>
      </Card>



      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="relative max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.currentTarget.value)}
              placeholder="Buscar por nome, endereço ou CNPJ"
              aria-label="Buscar empreendimento"
              className="pl-9"
            />
          </div>

          {developmentsQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-14 rounded-md" />
              <Skeleton className="h-14 rounded-md" />
              <Skeleton className="h-14 rounded-md" />
            </div>
          ) : null}

          {developmentsQuery.isError ? (
            <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
              <div className="flex items-start gap-2">
                <CircleHelpIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{getApiErrorMessage(developmentsQuery.error, "Não foi possível carregar os empreendimentos.")}</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => developmentsQuery.refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : null}

          {!developmentsQuery.isPending && !developmentsQuery.isError && items.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              <p>Nenhum empreendimento encontrado.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(routes.developmentCreate)}>
                Cadastrar empreendimento
              </Button>
            </div>
          ) : null}

          {!developmentsQuery.isPending && !developmentsQuery.isError && items.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empreendimento</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Compradores</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.id}
                      role="link"
                      tabIndex={0}
                      className="cursor-pointer transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => navigate(routes.developmentDetailById(item.id))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(routes.developmentDetailById(item.id));
                        }
                      }}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            <Building2Icon className="mr-1 inline h-3.5 w-3.5" />
                            {item.cnpj}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{item.cnpj}</TableCell>
                      <TableCell>{item.address}</TableCell>
                      <TableCell>{item.buyersCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
