import {
  Badge,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@registra/ui";
import { AlertTriangle, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

import { routes } from "@/shared/constants/routes";

import type { KanbanBuyer } from "./kanban-types";

const statusConfig = {
  pending: { label: "Aguardando documentos", variant: "warning" as const },
  in_analysis: { label: "Em análise", variant: "secondary" as const },
  approved: { label: "Aprovado", variant: "success" as const },
  rejected: { label: "Rejeitado", variant: "danger" as const },
};

function getDaysStuck(lastUpdate: string) {
  const now = new Date();
  const then = new Date(lastUpdate);
  const diff = now.getTime() - then.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function buildProcessLink(buyer: KanbanBuyer) {
  return routes.supplierDevelopmentBuyerProcessDetailById(
    buyer.supplierId,
    buyer.developmentId,
    buyer.buyerId,
    buyer.processId,
  );
}

function buildBuyerLink(buyer: KanbanBuyer) {
  return routes.supplierDevelopmentBuyerDetailById(
    buyer.supplierId,
    buyer.developmentId,
    buyer.buyerId,
  );
}

type KanbanCardProps = {
  buyer: KanbanBuyer;
};

export function KanbanCard({ buyer }: KanbanCardProps) {
  const daysStuck = getDaysStuck(buyer.lastUpdate);
  const isLate = daysStuck > 3;
  const isBlocked = buyer.status === "pending" || buyer.status === "rejected";
  const processLink = buildProcessLink(buyer);

  return (
    <Card
      className={[
        "group border-border/70 bg-card shadow-sm transition-[border-color,box-shadow] hover:shadow-md",
        isLate ? "border-destructive/30" : "",
      ].join(" ")}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link to={processLink} className="min-w-0 flex-1 space-y-1">
            <p className="truncate font-semibold text-foreground">{buyer.name}</p>
            <p className="truncate text-sm text-muted-foreground">{buyer.empreendimento}</p>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100"
                aria-label={`Ações para ${buyer.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={buildProcessLink(buyer)}>Ver processo</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={buildBuyerLink(buyer)}>Abrir detalhes</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Link to={processLink} className="block space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusConfig[buyer.status].variant}>{statusConfig[buyer.status].label}</Badge>
            <Badge variant={isLate ? "danger" : "outline"}>
              {daysStuck === 0 ? "hoje" : `há ${daysStuck} dia${daysStuck > 1 ? "s" : ""}`}
            </Badge>
            {isBlocked ? (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {buyer.status === "rejected"
                      ? "Processo rejeitado e aguardando nova ação."
                      : "Processo aguardando ação do comprador."}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>

        </Link>
      </CardContent>
    </Card>
  );
}
