import type { HeaderAction } from "@registra/ui";
import { useEffect } from "react";

import type { PageHeaderConfig } from "@/app/providers/page-header-provider";
import { usePageHeaderContext } from "@/app/providers/page-header-provider";

export function useRegisterPageHeader(
  config: {
    title: string;
    description?: string;
    actions?: HeaderAction[];
    showNotifications?: boolean;
  } | null,
) {
  const { setHeader } = usePageHeaderContext();

  useEffect(() => {
    setHeader(config as PageHeaderConfig | null);

    return () => {
      setHeader(null);
    };
  }, [config, setHeader]);
}
