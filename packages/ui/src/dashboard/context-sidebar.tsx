import { NavLink, matchPath, useLocation } from "react-router-dom";

import { cn } from "../lib/cn";
import type { ContextSidebarConfig } from "./types";

interface ContextSidebarProps {
  config: ContextSidebarConfig;
}

export function ContextSidebar({ config }: ContextSidebarProps) {
  const location = useLocation();

  return (
    <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 border-r border-border/70 bg-card/60 px-5 py-6 backdrop-blur-lg lg:block">
      <div className="space-y-1 border-b border-border/70 pb-5">
        <h2 className="truncate text-2xl font-semibold leading-8 tracking-[-0.02em] text-foreground">
          {config.title}
        </h2>
        {config.description ? (
          <p className="text-sm leading-6 text-muted-foreground">{config.description}</p>
        ) : null}
      </div>

      <nav aria-label={config.title} className="space-y-6 overflow-y-auto pt-5">
        {config.sections.map((section) => (
          <section key={section.sectionLabel} className="space-y-2">
            <p className="type-overline text-muted-foreground">
              {section.sectionLabel}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => (
                (() => {
                  const isPatternActive =
                    item.activePatterns?.some((pattern) =>
                      Boolean(matchPath({ path: pattern, end: true }, location.pathname)),
                    ) ?? false;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.exact}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm transition-colors",
                          item.inset ? "ml-8 border-l border-border/70 pl-5" : "",
                          isActive || isPatternActive
                            ? "border-primary/25 bg-primary/8 text-foreground shadow-sm"
                            : "text-muted-foreground hover:border-border hover:bg-secondary/60 hover:text-foreground",
                        )
                      }
                    >
                      {item.icon ? <item.icon className="mt-0.5 h-4 w-4 shrink-0" /> : null}
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{item.label}</span>
                      </span>
                    </NavLink>
                  );
                })()
              ))}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}
