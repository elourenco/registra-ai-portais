import type { ContextSidebarConfig } from "@registra/ui";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useContext } from "react";

interface WorkspaceSidebarContextValue {
  sidebar: ContextSidebarConfig | null;
  setSidebar: Dispatch<SetStateAction<ContextSidebarConfig | null>>;
}

const WorkspaceSidebarContext = createContext<WorkspaceSidebarContextValue | null>(null);

interface WorkspaceSidebarProviderProps extends WorkspaceSidebarContextValue {
  children: ReactNode;
}

export function WorkspaceSidebarProvider({
  children,
  sidebar,
  setSidebar,
}: WorkspaceSidebarProviderProps) {
  return (
    <WorkspaceSidebarContext.Provider value={{ sidebar, setSidebar }}>
      {children}
    </WorkspaceSidebarContext.Provider>
  );
}

export function useWorkspaceSidebarContext() {
  const context = useContext(WorkspaceSidebarContext);

  if (!context) {
    throw new Error("useWorkspaceSidebarContext must be used within WorkspaceSidebarProvider");
  }

  return context;
}
