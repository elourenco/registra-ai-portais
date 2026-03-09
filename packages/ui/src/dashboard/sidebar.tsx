import { ChevronLeft, Menu } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Button } from "../components/button";
import { cn } from "../lib/cn";
import type { SidebarSection } from "./types";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
  portalName: string;
  sections: SidebarSection[];
}

export function Sidebar({ collapsed, onToggleCollapsed, onNavigate, portalName, sections }: SidebarProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-border/70 bg-card/70 px-3 py-4 backdrop-blur-lg",
        collapsed ? "w-[88px]" : "w-[290px]",
      )}
    >
      <div className={cn("mb-6 flex items-center", collapsed ? "justify-center" : "justify-between px-1")}>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Registra AI</p>
            <h1 className="truncate text-base font-semibold">{portalName}</h1>
          </div>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav aria-label="Navegacao principal" className="space-y-4">
        {sections.map((section) => (
          <section key={section.sectionLabel} aria-label={section.sectionLabel} className="space-y-1">
            {!collapsed ? (
              <p className="px-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {section.sectionLabel}
              </p>
            ) : null}

            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                title={collapsed ? item.label : item.description}
                className={({ isActive }) =>
                  cn(
                    "group flex rounded-xl border border-transparent text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "border-primary/30 bg-primary/10 text-foreground shadow-sm"
                      : "text-muted-foreground hover:border-border hover:bg-secondary/60 hover:text-foreground",
                    collapsed ? "justify-center px-2 py-3" : "items-start gap-3 px-3 py-2.5",
                  )
                }
              >
                <item.icon className="mt-0.5 h-4 w-4 shrink-0" />
                {!collapsed ? (
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
                  </span>
                ) : null}
              </NavLink>
            ))}
          </section>
        ))}
      </nav>
    </div>
  );
}
