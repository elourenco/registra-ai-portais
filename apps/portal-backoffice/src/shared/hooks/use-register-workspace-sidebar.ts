import type { ContextSidebarConfig } from "@registra/ui";
import { useEffect } from "react";

import { useWorkspaceSidebarContext } from "@/app/providers/workspace-sidebar-provider";

export function useRegisterWorkspaceSidebar(config: ContextSidebarConfig | null) {
  const { setSidebar } = useWorkspaceSidebarContext();

  useEffect(() => {
    setSidebar(config);
  }, [config, setSidebar]);
}
