export type UserRole = "customer" | "supplier" | "backoffice";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  supplierCompanyId?: string | null;
}
