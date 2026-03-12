import { Building2, FolderKanban, Settings2 } from "lucide-react";

import { cn } from "@registra/ui";

export type SupplierDetailTab = "developments" | "processes" | "settings";

interface SupplierDetailTabsProps {
  activeTab: SupplierDetailTab;
  onTabChange: (tab: SupplierDetailTab) => void;
}

const tabs: Array<{
  id: SupplierDetailTab;
  label: string;
  icon: typeof Building2;
}> = [
  { id: "developments", label: "Empreendimento", icon: Building2 },
  { id: "processes", label: "Processos", icon: FolderKanban },
  { id: "settings", label: "Configuração", icon: Settings2 },
];

export function SupplierDetailTabs({ activeTab, onTabChange }: SupplierDetailTabsProps) {
  return (
    <div className="border-b border-border/70">
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
