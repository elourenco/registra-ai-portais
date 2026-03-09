import { z } from "zod";

export const dashboardPortalRoleSchema = z.enum(["backoffice", "supplier", "customer"]);
export type DashboardPortalRole = z.infer<typeof dashboardPortalRoleSchema>;

export const transactionStatusSchema = z.enum(["paid", "pending", "failed", "refunded"]);
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

export const transactionCategorySchema = z.enum([
  "subscriptions",
  "services",
  "operations",
  "payroll",
  "taxes",
  "marketing",
]);
export type TransactionCategory = z.infer<typeof transactionCategorySchema>;

export const transactionMethodSchema = z.enum(["pix", "bank_transfer", "credit_card", "debit_card", "boleto"]);
export type TransactionMethod = z.infer<typeof transactionMethodSchema>;

export const dashboardTransactionSchema = z.object({
  id: z.string().min(1),
  date: z.string().datetime({ offset: true }),
  description: z.string().min(3),
  category: transactionCategorySchema,
  method: transactionMethodSchema,
  status: transactionStatusSchema,
  value: z.number(),
});
export type DashboardTransaction = z.infer<typeof dashboardTransactionSchema>;

export const dashboardChartPointSchema = z.object({
  period: z.string().min(1),
  revenue: z.number().nonnegative(),
  expenses: z.number().nonnegative(),
});
export type DashboardChartPoint = z.infer<typeof dashboardChartPointSchema>;

export const dashboardKpiSchema = z.object({
  key: z.enum(["revenue", "expenses", "profit", "runRate"]),
  label: z.string().min(2),
  value: z.number(),
  deltaPercentage: z.number(),
});
export type DashboardKpi = z.infer<typeof dashboardKpiSchema>;

export const dashboardFiltersSchema = z.object({
  search: z.string().trim().max(80).default(""),
  status: z.union([z.literal("all"), transactionStatusSchema]).default("all"),
  category: z.union([z.literal("all"), transactionCategorySchema]).default("all"),
});
export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;

export const dashboardQuerySchema = z.object({
  portalRole: dashboardPortalRoleSchema,
  simulateDelayMs: z.number().int().min(150).max(3000).default(850),
  failRate: z.number().min(0).max(1).default(0.1),
  forceError: z.boolean().default(false),
});
export type DashboardQueryInput = z.input<typeof dashboardQuerySchema>;

export const dashboardSnapshotSchema = z.object({
  kpis: z.array(dashboardKpiSchema).length(4),
  chart: z.array(dashboardChartPointSchema).min(6),
  transactions: z.array(dashboardTransactionSchema),
  generatedAt: z.string().datetime({ offset: true }),
});
export type DashboardSnapshot = z.infer<typeof dashboardSnapshotSchema>;
