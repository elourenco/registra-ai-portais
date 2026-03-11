import { NavLink } from "react-router-dom";

import { cn } from "../lib/cn";
import type { ContextSidebarConfig } from "./types";

interface ContextSidebarProps {
  config: ContextSidebarConfig;
}

export function ContextSidebar({ config }: ContextSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 border-r border-border/70 bg-card/60 px-5 py-6 backdrop-blur-lg lg:block">
      <div className="space-y-1 border-b border-border/70 pb-5">
        <h2 className="truncate text-xl font-semibold text-foreground">{config.title}</h2>
        {config.description ? (
          <p className="text-sm leading-6 text-muted-foreground">{config.description}</p>
        ) : null}
      </div>

      <nav aria-label={config.title} className="space-y-6 overflow-y-auto pt-5">
        {config.sections.map((section) => (
          <section key={section.sectionLabel} className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {section.sectionLabel}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  reloadDocument
                  end={item.exact}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm transition-colors",
                      isActive
                        ? "border-primary/25 bg-primary/8 text-foreground shadow-sm"
                        : "text-muted-foreground hover:border-border hover:bg-secondary/60 hover:text-foreground",
                    )
                  }
                  >
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.label}</span>
                  </span>
                </NavLink>
              ))}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}
