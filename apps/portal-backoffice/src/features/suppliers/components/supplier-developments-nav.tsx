import type { SupplierDevelopmentListItem } from "@registra/shared";
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@registra/ui";
import { EllipsisVertical, Info, Plus } from "lucide-react";
interface SupplierDevelopmentsNavProps {
  items: SupplierDevelopmentListItem[];
  onOpenDetails: (development: SupplierDevelopmentListItem) => void;
  onSelectDevelopment: (developmentId: string) => void;
  selectedDevelopmentId: string | null;
}

export function SupplierDevelopmentsNav({
  items,
  onOpenDetails,
  onSelectDevelopment,
  selectedDevelopmentId,
}: SupplierDevelopmentsNavProps) {
  return (
    <aside className="rounded-xl border border-border/70 bg-card/95 p-4 shadow-sm lg:sticky lg:top-6">
      <div className="flex items-start justify-between gap-3 px-2 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Empreendimentos
        </p>
        <button
          type="button"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted/60 hover:text-foreground"
          aria-label="Adicionar empreendimento"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 space-y-1">
        {items.map((development) => {
          const isActive = development.id === selectedDevelopmentId;

          return (
            <div
              key={development.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl p-[0.6rem] transition-colors",
                isActive
                  ? "bg-muted/80 text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              <button
                type="button"
                onClick={() => onSelectDevelopment(development.id)}
                className="min-w-0 flex-1 self-center text-left"
              >
                <p
                  className={cn(
                    "truncate text-sm",
                    isActive ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
                  )}
                >
                  {development.name}
                </p>
              </button>

              <div className="shrink-0 self-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      aria-label={`Ações do empreendimento ${development.name}`}
                    >
                      <EllipsisVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={12}
                      className="w-60 rounded-xl border-border/80 p-2 shadow-xl"
                    >
                    <DropdownMenuLabel className="px-3 py-2">
                      <p className="truncate text-sm font-semibold">{development.name}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 rounded-xl px-3 py-2" onClick={() => onOpenDetails(development)}>
                      <Info className="mr-2 h-4 w-4" />
                      Detalhes
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
