import { ArrowLeft, Bell, ChevronRight, Menu, Search } from "lucide-react";
import { Link } from "react-router-dom";

import { Button, buttonVariants } from "../components/button";
import { Input } from "../components/input";
import { cn } from "../lib/cn";
import type {
  BreadcrumbItem,
  HeaderAction,
  HeaderIcon,
  HeaderLeadingAction,
  HeaderUtilityAction,
} from "./types";

interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  headerIcon?: HeaderIcon;
  title?: string;
  description?: string;
  headerActions?: HeaderAction[];
  headerLeadingAction?: HeaderLeadingAction;
  headerUtilityAction?: HeaderUtilityAction;
  showNotifications?: boolean;
  onOpenMobileSidebar: () => void;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
}

export function Header({
  breadcrumbs,
  headerIcon: HeaderIcon,
  title,
  description,
  headerActions,
  headerLeadingAction,
  headerUtilityAction,
  showNotifications = true,
  onOpenMobileSidebar,
  onSearchChange,
  searchPlaceholder,
}: HeaderProps) {
  const contextualModule =
    breadcrumbs?.find((item) => item.label.toLowerCase() !== "dashboard")?.label ?? "atual";
  const resolvedTitle = title ?? breadcrumbs?.[breadcrumbs.length - 1]?.label ?? "Painel";
  const resolvedDescription =
    description ??
    (breadcrumbs && breadcrumbs.length > 1
      ? `Navegação contextual do módulo ${contextualModule.toLowerCase()}.`
      : "Acompanhe e opere este módulo a partir do painel principal.");

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/92 backdrop-blur-xl">
      <div className="px-4 md:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
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

              <div className="flex min-w-0 items-start gap-3">
                {headerLeadingAction?.to ? (
                  <Link
                    to={headerLeadingAction.to}
                    aria-label={headerLeadingAction.ariaLabel}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "icon" }),
                      "hidden h-12 w-12 shrink-0 rounded-2xl border-border/80 bg-card/90 text-foreground shadow-sm sm:inline-flex",
                    )}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                ) : headerLeadingAction?.onClick ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={headerLeadingAction.ariaLabel}
                    className="hidden h-12 w-12 shrink-0 rounded-2xl border-border/80 bg-card/90 text-foreground shadow-sm sm:inline-flex"
                    onClick={headerLeadingAction.onClick}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                ) : (
                  <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-card/90 text-foreground shadow-sm sm:flex">
                    {HeaderIcon ? <HeaderIcon className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                  </div>
                )}

                <div className="min-w-0 space-y-1">
                  {breadcrumbs && breadcrumbs.length > 1 ? (
                    <nav
                      aria-label="Breadcrumb"
                      className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground"
                    >
                      {breadcrumbs.map((item, index) => (
                        <div
                          key={`${item.label}-${index}`}
                          className="inline-flex min-w-0 items-center gap-1"
                        >
                          {index > 0 ? <ChevronRight className="h-3 w-3 shrink-0" /> : null}
                          {item.to && index < breadcrumbs.length - 1 ? (
                            <Link
                              to={item.to}
                              className="truncate transition-colors hover:text-foreground"
                            >
                              {item.label}
                            </Link>
                          ) : (
                            <span
                              className={cn(
                                "truncate",
                                index === breadcrumbs.length - 1
                                  ? "font-medium text-foreground"
                                  : undefined,
                              )}
                            >
                              {item.label}
                            </span>
                          )}
                        </div>
                      ))}
                    </nav>
                  ) : null}
                  <p className="truncate text-[1.35rem] font-semibold leading-none text-foreground">
                    {resolvedTitle}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {resolvedDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="relative hidden w-[280px] lg:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  className={cn("h-10 rounded-xl border-border/80 bg-card/85 pl-9 pr-10 shadow-sm")}
                  placeholder={searchPlaceholder}
                  onChange={(event) => onSearchChange(event.currentTarget.value)}
                  aria-label="Buscar no dashboard"
                />
              </div>

              {showNotifications ? (
                headerUtilityAction ? (
                  headerUtilityAction.to ? (
                    <Link
                      to={headerUtilityAction.to}
                      aria-label={headerUtilityAction.ariaLabel}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "icon" }),
                        "hidden rounded-xl border-border/80 bg-card/85 shadow-sm sm:inline-flex",
                      )}
                    >
                      <headerUtilityAction.icon className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="hidden rounded-xl border-border/80 bg-card/85 shadow-sm sm:inline-flex"
                      aria-label={headerUtilityAction.ariaLabel}
                      onClick={headerUtilityAction.onClick}
                    >
                      <headerUtilityAction.icon className="h-4 w-4" />
                    </Button>
                  )
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="hidden rounded-xl border-border/80 bg-card/85 shadow-sm sm:inline-flex"
                    aria-label="Notificações"
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                )
              ) : null}

              {headerActions?.map((action) =>
                action.to ? (
                  <Link
                    key={`${action.label}-${action.to}`}
                    to={action.to}
                    className={buttonVariants({
                      size: "sm",
                      variant: action.variant ?? "default",
                    })}
                  >
                    {action.label}
                  </Link>
                ) : (
                  <Button
                    key={action.label}
                    type="button"
                    size="sm"
                    variant={action.variant ?? "default"}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </Button>
                ),
              )}
            </div>
          </div>

          <div className="relative block w-full lg:hidden">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              className={cn("h-10 rounded-xl border-border/80 bg-card/85 pl-9 shadow-sm")}
              placeholder={searchPlaceholder}
              onChange={(event) => onSearchChange(event.currentTarget.value)}
              aria-label="Buscar no dashboard"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
