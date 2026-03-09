import { z } from "zod";

export const backofficeUserRoleSchema = z.enum(["backoffice_admin"]);

export const backofficeUserStatusSchema = z.enum([
  "pending_onboarding",
  "active",
  "suspended",
]);

export const backofficeUserListStatusFilterSchema = z.union([
  z.literal("all"),
  backofficeUserStatusSchema,
]);

export const backofficeUserListFiltersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(120).default(""),
  status: backofficeUserListStatusFilterSchema.default("all"),
});

export const backofficeUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: backofficeUserRoleSchema,
  status: backofficeUserStatusSchema,
  createdAt: z.string().min(1),
});

export const backofficeUsersPaginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(1),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const backofficeUsersListResultSchema = z.object({
  items: z.array(backofficeUserSchema),
  pagination: backofficeUsersPaginationSchema,
});

export const createBackofficeUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe um nome com pelo menos 3 caracteres")
    .max(120, "Informe um nome com no máximo 120 caracteres"),
  email: z.string().trim().email("Informe um e-mail válido"),
  password: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .max(64, "A senha deve ter no máximo 64 caracteres"),
});

export const updateBackofficeUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe um nome com pelo menos 3 caracteres")
    .max(120, "Informe um nome com no máximo 120 caracteres"),
  email: z.string().trim().email("Informe um e-mail válido"),
  password: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .max(64, "A senha deve ter no máximo 64 caracteres")
    .or(z.literal("")),
  status: z.enum(["active", "suspended"]),
});

export type BackofficeUserRole = z.infer<typeof backofficeUserRoleSchema>;
export type BackofficeUserStatus = z.infer<typeof backofficeUserStatusSchema>;
export type BackofficeUserListStatusFilter = z.infer<typeof backofficeUserListStatusFilterSchema>;
export type BackofficeUserListFilters = z.infer<typeof backofficeUserListFiltersSchema>;
export type BackofficeUser = z.infer<typeof backofficeUserSchema>;
export type BackofficeUsersPagination = z.infer<typeof backofficeUsersPaginationSchema>;
export type BackofficeUsersListResult = z.infer<typeof backofficeUsersListResultSchema>;
export type CreateBackofficeUserInput = z.input<typeof createBackofficeUserSchema>;
export type CreateBackofficeUserPayload = z.output<typeof createBackofficeUserSchema>;
export type UpdateBackofficeUserInput = z.input<typeof updateBackofficeUserSchema>;
export type UpdateBackofficeUserPayload = z.output<typeof updateBackofficeUserSchema>;
