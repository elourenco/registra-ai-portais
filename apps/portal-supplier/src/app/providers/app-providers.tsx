import { Toaster } from "@registra/ui";
import type { PropsWithChildren } from "react";

import { AuthProvider } from "@/app/providers/auth-provider";
import { QueryProvider } from "@/app/providers/query-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  );
}
