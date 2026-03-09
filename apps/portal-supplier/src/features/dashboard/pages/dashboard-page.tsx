import { DashboardModule } from "@registra/ui";

import { portalConfig } from "@/shared/config/portal-config";

export function DashboardPage() {
  return <DashboardModule portalName={portalConfig.name} portalRole={portalConfig.role} />;
}
