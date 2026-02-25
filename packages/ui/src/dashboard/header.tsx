import {
  Bell,
  LogOut,
  Menu,
  MoonStar,
  Search,
  SunMedium,
  UserCircle2,
} from "lucide-react";

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
import { Input } from "../components/input";
import { cn } from "../lib/cn";
import type { PortalUser } from "./types";

interface HeaderProps {
  isDarkMode: boolean;
  onOpenMobileSidebar: () => void;
  onSearchChange: (value: string) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  onProfile?: () => void;
  searchPlaceholder: string;
  user: PortalUser;
}

function getUserInitials(user: PortalUser): string {
  const source = user.name?.trim() || user.email?.trim() || "U";
  const parts = source.split(" ").slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

export function Header({
  isDarkMode,
  onLogout,
  onOpenMobileSidebar,
  onProfile,
  onSearchChange,
  onToggleTheme,
  searchPlaceholder,
  user,
}: HeaderProps) {
  const initials = getUserInitials(user);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto grid h-16 w-full max-w-7xl grid-cols-[auto,1fr,auto] items-center gap-3 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menu lateral"
            onClick={onOpenMobileSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden md:inline-flex"
            aria-label={isDarkMode ? "Ativar tema claro" : "Ativar tema escuro"}
            onClick={onToggleTheme}
          >
            {isDarkMode ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </Button>
        </div>

        <label className="relative mx-auto block w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            className={cn("h-10 rounded-full border-border/80 bg-card/70 pl-9 shadow-sm")}
            placeholder={searchPlaceholder}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
            aria-label="Buscar no dashboard"
          />
        </label>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden sm:inline-flex"
            aria-label="Notificacoes"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-border/80 bg-card/80 p-1 pr-2.5 text-left shadow-sm transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Abrir menu do usuario"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[140px] truncate text-sm font-medium sm:inline">{user.name ?? "Usuario"}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <p className="text-sm font-semibold">{user.name ?? "Usuario"}</p>
                <p className="text-xs font-normal text-muted-foreground">{user.email ?? "-"}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onProfile ? (
                <DropdownMenuItem onClick={onProfile}>
                  <UserCircle2 className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
