export const routes = {
  login: "/login",
  dashboard: "/dashboard",
  suppliers: "/suppliers",
  supplierDetail: "/suppliers/:supplierId/information",
  supplierDetailById: (supplierId: string) =>
    `/suppliers/${encodeURIComponent(supplierId)}/information`,
  supplierDevelopments: "/suppliers/:supplierId/developments",
  supplierDevelopmentsById: (supplierId: string) =>
    `/suppliers/${encodeURIComponent(supplierId)}/developments`,
  supplierDevelopmentDetail: "/suppliers/:supplierId/developments/:developmentId",
  supplierDevelopmentDetailById: (supplierId: string, developmentId: string) =>
    `/suppliers/${encodeURIComponent(supplierId)}/developments/${encodeURIComponent(developmentId)}`,
  supplierDevelopmentBuyers: "/suppliers/:supplierId/developments/:developmentId/buyers",
  supplierDevelopmentBuyersById: (supplierId: string, developmentId: string) =>
    `/suppliers/${encodeURIComponent(supplierId)}/developments/${encodeURIComponent(developmentId)}/buyers`,
  supplierDevelopmentBuyerDetail:
    "/suppliers/:supplierId/developments/:developmentId/buyers/:buyerId",
  supplierDevelopmentBuyerDetailById: (
    supplierId: string,
    developmentId: string,
    buyerId: string,
  ) =>
    `/suppliers/${encodeURIComponent(supplierId)}/developments/${encodeURIComponent(
      developmentId,
    )}/buyers/${encodeURIComponent(buyerId)}`,
  supplierDevelopmentBuyerProcessDetail:
    "/suppliers/:supplierId/developments/:developmentId/buyers/:buyerId/processes/:processId",
  supplierDevelopmentBuyerProcessDetailById: (
    supplierId: string,
    developmentId: string,
    buyerId: string,
    processId: string,
  ) =>
    `/suppliers/${encodeURIComponent(supplierId)}/developments/${encodeURIComponent(
      developmentId,
    )}/buyers/${encodeURIComponent(buyerId)}/processes/${encodeURIComponent(processId)}`,
  supplierBuyers: "/suppliers/:supplierId/buyers",
  supplierBuyersById: (supplierId: string) => `/suppliers/${encodeURIComponent(supplierId)}/buyers`,
  supplierProcesses: "/suppliers/:supplierId/processes",
  supplierProcessesById: (supplierId: string) =>
    `/suppliers/${encodeURIComponent(supplierId)}/processes`,
  supplierRequests: "/suppliers/:supplierId/requests",
  supplierRequestsById: (supplierId: string) =>
    `/suppliers/${encodeURIComponent(supplierId)}/requests`,
  supplierTasks: "/suppliers/:supplierId/tasks",
  supplierTasksById: (supplierId: string) => `/suppliers/${encodeURIComponent(supplierId)}/tasks`,
  supplierDocuments: "/suppliers/:supplierId/documents",
  supplierDocumentsById: (supplierId: string) =>
    `/suppliers/${encodeURIComponent(supplierId)}/documents`,
  supplierRequirements: "/suppliers/:supplierId/requirements",
  supplierRequirementsById: (supplierId: string) =>
    `/suppliers/${encodeURIComponent(supplierId)}/requirements`,
  developments: "/developments",
  developmentRegistration: "/developments/new",
  developmentDetail: "/developments/:developmentId",
  developmentDetailById: (developmentId: string) => `/developments/${encodeURIComponent(developmentId)}`,
  buyers: "/buyers",
  buyerDetail: "/buyers/:buyerId",
  buyerDetailById: (buyerId: string) => `/buyers/${encodeURIComponent(buyerId)}`,
  customers: "/customers",
  customerDetail: "/customers/:customerId",
  customerDetailById: (customerId: string) => `/customers/${encodeURIComponent(customerId)}`,
  developmentBuyerRegistration: "/developments/:developmentId/buyers/new",
  developmentBuyerRegistrationById: (developmentId: string) =>
    `/developments/${encodeURIComponent(developmentId)}/buyers/new`,
  processes: "/processes",
  processDetail: "/processes/:processId",
  processDetailById: (processId: string) => `/processes/${encodeURIComponent(processId)}`,
  requests: "/requests",
  tasks: "/tasks",
  documents: "/documents",
  requirements: "/requirements",
  settings: "/settings",
  workflowList: "/workflow/list",
  workflowSteps: "/workflows/:workflowId/steps",
  workflowStepsById: (workflowId: string) => `/workflows/${encodeURIComponent(workflowId)}/steps`,
  workflowRules: "/workflows/:workflowId/steps/:stepId/rules",
  workflowRulesById: (workflowId: string, stepId: string) =>
    `/workflows/${encodeURIComponent(workflowId)}/steps/${encodeURIComponent(stepId)}/rules`,
  backofficeUsers: "/settings/users",
  profile: "/profile",
} as const;
