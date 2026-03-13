import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@registra/ui";
import { useState } from "react";
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

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Empreendimentos</h2>
          <p className="text-sm text-muted-foreground">
            Lista do supplier. O clique na linha abre o detalhe completo do empreendimento.
          </p>
        </div>
        <Button type="button" onClick={() => navigate(routes.developmentCreate)}>
          Cadastrar empreendimento
        </Button>
      </header>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Carteira de empreendimentos</CardTitle>
          <CardDescription>Empreendimentos vinculados ao supplier autenticado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.currentTarget.value)}
            placeholder="Buscar por nome, endereço ou CNPJ"
            aria-label="Buscar empreendimento"
          />

          {developmentsQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-14 rounded-md" />
              <Skeleton className="h-14 rounded-md" />
              <Skeleton className="h-14 rounded-md" />
            </div>
          ) : null}

          {developmentsQuery.isError ? (
            <div className="space-y-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>{getApiErrorMessage(developmentsQuery.error, "Não foi possível carregar os empreendimentos.")}</p>
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
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empreendimento</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Status</TableHead>
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
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.cnpj}</TableCell>
                      <TableCell>{item.address}</TableCell>
                      <TableCell>{item.status}</TableCell>
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
