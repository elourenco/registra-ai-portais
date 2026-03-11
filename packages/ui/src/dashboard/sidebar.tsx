import { ChevronLeft, LogOut, Menu, MoreHorizontal, Settings, UserCircle2 } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Avatar, AvatarFallback } from "../components/avatar";
import { Button } from "../components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { cn } from "../lib/cn";
import type { ConfigMenuItem, PortalUser, SidebarSection } from "./types";

interface SidebarProps {
  collapsed: boolean;
  hideToggle?: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
  portalName: string;
  sections: SidebarSection[];
  user: PortalUser;
  configItems?: ConfigMenuItem[];
  onLogout: () => void;
  onProfile?: () => void;
}

function getUserInitials(user: PortalUser): string {
  const source = user.name?.trim() || user.email?.trim() || "U";
  const parts = source.split(" ").slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

export function Sidebar({
  collapsed,
  hideToggle = false,
  onToggleCollapsed,
  onNavigate,
  portalName,
  sections,
  user,
  configItems,
  onLogout,
  onProfile,
}: SidebarProps) {
  const initials = getUserInitials(user);

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-x-hidden border-r border-border/70 bg-[#fcfcfd] px-3 py-4 backdrop-blur-lg",
        collapsed ? "w-[86px]" : "w-[286px]",
      )}
    >
      <div
        className={cn(
          "mb-6 flex min-h-12 items-center",
          collapsed ? "justify-center" : "justify-between px-1",
        )}
      >
        {!collapsed ? (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#4f46e5)] text-sm font-semibold text-white shadow-[0_12px_24px_-12px_rgba(37,99,235,0.65)]">
              RA
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-foreground">{portalName}</h1>
              <p className="truncate text-sm text-muted-foreground">Backoffice operacional</p>
            </div>
          </div>
        ) : null}

        {!hideToggle ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl border border-border/70"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        ) : null}
      </div>

      <div className="mb-5 border-b border-border/70" />

      <nav
        aria-label="Navegação principal"
        className="flex-1 space-y-5 overflow-x-hidden overflow-y-auto"
      >
        {sections.map((section) => (
          <section
            key={section.sectionLabel || section.items.map((item) => item.to).join("|")}
            aria-label={section.sectionLabel || undefined}
            className="space-y-1.5"
          >
            {!collapsed && section.sectionLabel.trim() ? (
              <p className="px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {section.sectionLabel}
              </p>
            ) : null}

            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={onNavigate}
                title={collapsed ? item.label : item.description}
                className={({ isActive }) =>
                  cn(
                    "group relative flex rounded-xl border text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "border-border bg-secondary text-foreground shadow-sm"
                      : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-secondary/55 hover:text-foreground",
                    collapsed ? "justify-center px-2 py-3" : "items-start gap-3 px-3 py-2.5",
                  )
                }
              >
                {item.icon ? <item.icon className="mt-0.5 h-4 w-4 shrink-0" /> : null}
                {!collapsed ? (
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.label}</span>
                  </span>
                ) : null}
              </NavLink>
            ))}
          </section>
        ))}
      </nav>

      <div className="mt-5 border-t border-border/70 pt-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex w-full items-center rounded-2xl bg-card/90 text-left transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
              )}
              aria-label="Abrir menu do usuário"
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed ? (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {user.name ?? "Usuário"}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {user.email ?? "-"}
                    </span>
                  </span>
                  <MoreHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
                </>
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={collapsed ? "start" : "end"}
            side="right"
            sideOffset={12}
            className="w-60 rounded-2xl border-border/80 p-2 shadow-xl"
          >
            <DropdownMenuLabel className="px-3 py-2">
              <p className="text-sm font-semibold">{user.name ?? "Usuário"}</p>
              <p className="text-xs font-normal text-muted-foreground">{user.email ?? "-"}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {onProfile ? (
              <DropdownMenuItem className="gap-2 rounded-xl px-3 py-2" onClick={onProfile}>
                <UserCircle2 className="h-4 w-4" />
                Perfil
              </DropdownMenuItem>
            ) : null}
            {configItems?.map((item) => (
              <DropdownMenuItem
                key={item.label}
                className="gap-2 rounded-xl px-3 py-2"
                onClick={item.onClick}
              >
                <Settings className="h-4 w-4" />
                {item.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 rounded-xl px-3 py-2" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
