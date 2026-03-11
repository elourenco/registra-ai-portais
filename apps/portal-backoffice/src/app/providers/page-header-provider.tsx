import type { HeaderAction } from "@registra/ui";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useContext } from "react";

export interface PageHeaderConfig {
  title: string;
  description?: string;
  actions?: HeaderAction[];
  showNotifications?: boolean;
}

interface PageHeaderContextValue {
  header: PageHeaderConfig | null;
  setHeader: Dispatch<SetStateAction<PageHeaderConfig | null>>;
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

interface PageHeaderProviderProps extends PageHeaderContextValue {
  children: ReactNode;
}

export function PageHeaderProvider({
  children,
  header,
  setHeader,
}: PageHeaderProviderProps) {
  return <PageHeaderContext.Provider value={{ header, setHeader }}>{children}</PageHeaderContext.Provider>;
}

export function usePageHeaderContext() {
  const context = useContext(PageHeaderContext);

  if (!context) {
    throw new Error("usePageHeaderContext must be used within PageHeaderProvider");
  }

  return context;
}
