import type { HeaderAction } from "@registra/ui";
import { useEffect, useMemo, useRef } from "react";

import type { PageHeaderConfig } from "@/app/providers/page-header-provider";
import { usePageHeaderContext } from "@/app/providers/page-header-provider";

export function useRegisterPageHeader(
  config: {
    title: string;
    description?: string;
    actions?: HeaderAction[];
    leadingAction?: PageHeaderConfig["leadingAction"];
    showNotifications?: boolean;
  } | null,
) {
  const { setHeader } = usePageHeaderContext();
  const latestConfigRef = useRef(config);
  latestConfigRef.current = config;

  const stableConfig = useMemo<PageHeaderConfig | null>(() => {
    if (!config) {
      return null;
    }

    return {
      title: config.title,
      description: config.description,
      showNotifications: config.showNotifications,
      leadingAction: config.leadingAction
        ? {
            ariaLabel: config.leadingAction.ariaLabel,
            to: config.leadingAction.to,
            onClick: config.leadingAction.onClick
              ? () => latestConfigRef.current?.leadingAction?.onClick?.()
              : undefined,
          }
        : undefined,
      actions: config.actions?.map((action, index) => ({
        label: action.label,
        to: action.to,
        variant: action.variant,
        onClick: action.onClick
          ? () => latestConfigRef.current?.actions?.[index]?.onClick?.()
          : undefined,
      })),
    };
  }, [
    config?.title,
    config?.description,
    config?.showNotifications,
    config?.leadingAction?.ariaLabel,
    config?.leadingAction?.to,
    config?.actions
      ?.map((action) => `${action.label}:${action.to ?? ""}:${action.variant ?? ""}`)
      .join("|"),
  ]);

  useEffect(() => {
    setHeader(stableConfig);

    return () => {
      setHeader(null);
    };
  }, [setHeader, stableConfig]);
}
