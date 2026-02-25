export const routes = {
  login: "/login",
  dashboard: "/dashboard",
  customers: "/customers",
  customerDetail: "/customers/:customerId",
  customerDetailById: (customerId: string) => `/customers/${encodeURIComponent(customerId)}`,
  suppliers: "/suppliers",
  workflowList: "/workflow/list",
  workflowSteps: "/workflow/steps",
  workflowRules: "/workflow/rules",
  profile: "/profile",
} as const;
