import type { WorkflowRuleType } from "@registra/shared";

export function getWorkflowRuleTypeClasses(type: WorkflowRuleType): string {
  switch (type) {
    case "form_fill":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "document_upload":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "fee_payment":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "manual_review":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}
