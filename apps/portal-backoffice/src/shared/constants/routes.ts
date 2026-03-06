export const routes = {
  login: "/login",
  dashboard: "/dashboard",
  customers: "/customers",
  customerDetail: "/customers/:customerId",
  customerDetailById: (customerId: string) => `/customers/${encodeURIComponent(customerId)}`,
  suppliers: "/suppliers",
  supplierDetail: "/suppliers/:supplierId",
  supplierDetailById: (supplierId: string) => `/suppliers/${encodeURIComponent(supplierId)}`,
  workflowList: "/workflow/list",
  workflowSteps: "/workflows/:workflowId/steps",
  workflowStepsById: (workflowId: string) => `/workflows/${encodeURIComponent(workflowId)}/steps`,
  workflowRules: "/workflows/:workflowId/steps/:stepId/rules",
  workflowRulesById: (workflowId: string, stepId: string) =>
    `/workflows/${encodeURIComponent(workflowId)}/steps/${encodeURIComponent(stepId)}/rules`,
  profile: "/profile",
} as const;
