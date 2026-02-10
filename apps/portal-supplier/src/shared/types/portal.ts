import type { UserRole } from "@registra/shared";

export interface PortalConfig {
  name: string;
  tagline: string;
  role: UserRole;
  gradient: string;
}
