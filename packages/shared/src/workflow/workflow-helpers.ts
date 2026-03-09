import type { WorkflowCatalog } from "./workflow-schema";

export function ensureSingleDefaultWorkflow(workflows: WorkflowCatalog): WorkflowCatalog {
  if (workflows.length === 0) {
    return workflows;
  }

  const normalized = workflows.map((workflow) => ({
    ...workflow,
    steps: [...workflow.steps].sort((a, b) => a.order - b.order),
  }));

  const firstDefault = normalized.find((workflow) => workflow.isDefault);

  if (!firstDefault) {
    return normalized.map((workflow, index) => ({
      ...workflow,
      isDefault: index === 0,
    }));
  }

  return normalized.map((workflow) => ({
    ...workflow,
    isDefault: workflow.id === firstDefault.id,
  }));
}

export function normalizeSupplierKey(supplierKey: string): string {
  return supplierKey.trim().toLowerCase();
}
