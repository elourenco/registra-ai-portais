import type {
  BillingStatus,
  DocumentStatus,
  DocumentUploadedBy,
  DocumentType,
  ProcessStatus,
  RegistrationDevelopmentStatus,
  RegistrationBuyerStatus,
  RegistrationSupplierStatus,
  RequestStatus,
  RequestTarget,
  RequestType,
  RequirementStatus,
  TaskStatus,
  TaskType,
  WorkflowBlockKey,
  WorkflowBlockStatus,
} from "@registra/shared";

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatCnpj(value: string): string {
  return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, "$1.$2.$3/$4-$5");
}

export function formatCpf(value: string): string {
  return value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, "$1.$2.$3-$4");
}

export const supplierStatusLabels: Record<RegistrationSupplierStatus, string> = {
  active: "Ativo",
  onboarding: "Onboarding",
  inactive: "Inativo",
  blocked: "Bloqueado",
};

export const developmentStatusLabels: Record<RegistrationDevelopmentStatus, string> = {
  active: "Ativo",
  launching: "Lançamento",
  completed: "Concluído",
  blocked: "Bloqueado",
};

export const buyerStatusLabels: Record<RegistrationBuyerStatus, string> = {
  active: "Ativo",
  pending_documents: "Documentos pendentes",
  blocked: "Bloqueado",
};

export const processStatusLabels: Record<ProcessStatus, string> = {
  active: "Ativo",
  waiting_supplier: "Aguardando resposta externa",
  waiting_registry_office: "Aguardando cartório",
  requirement_open: "Exigência",
  overdue: "Atrasado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const blockTitleLabels: Record<WorkflowBlockKey, string> = {
  certificate: "Certificado",
  contract: "Contrato",
  registration: "Registro",
};

export const blockStatusLabels: Record<WorkflowBlockStatus, string> = {
  pending: "Pendente",
  waiting_supplier: "Aguardando resposta externa",
  in_review: "Em análise",
  rejected: "Reprovado",
  approved: "Aprovado",
  in_preparation: "Em preparação",
  waiting_signature: "Aguardando assinatura",
  signed: "Assinado",
  waiting_payment: "Aguardando pagamento",
  in_registry: "Em registro",
  waiting_registry_office: "Aguardando cartório",
  requirement_open: "Exigência aberta",
  requirement_resolved: "Exigência resolvida",
  registered: "Registrado",
};

export const requestTypeLabels: Record<RequestType, string> = {
  document_submission: "Envio de documentos",
  information_confirmation: "Confirmação de informações",
  contract_submission: "Envio de contrato",
  signature: "Assinatura",
  payment: "Pagamento",
  correction: "Correção",
};

export const requestStatusLabels: Record<RequestStatus, string> = {
  created: "Criada",
  sent: "Enviada",
  responded: "Respondido",
  in_review: "Em análise",
  approved: "Aprovado",
  rejected: "Reprovado",
  resubmission_requested: "Reenvio solicitado",
  completed: "Concluída",
};

export const requestTargetLabels: Record<RequestTarget, string> = {
  supplier: "Supplier",
  buyer: "Comprador",
};

export const taskTypeLabels: Record<TaskType, string> = {
  contact: "Contato",
  validation: "Validação",
  analysis: "Análise",
  correction: "Correção",
  sending: "Envio",
  follow_up: "Acompanhamento",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export const documentTypeLabels: Record<DocumentType, string> = {
  personal_documents: "Documentos pessoais",
  deed: "Escritura",
  contract: "Contrato",
  itbi_receipt: "Comprovante ITBI",
  registered_deed: "Matrícula registrada",
};

export const documentStatusLabels: Record<DocumentStatus, string> = {
  sent: "Enviado",
  in_review: "Em análise",
  approved: "Aprovado",
  rejected: "Reprovado",
  resubmission_requested: "Reenvio solicitado",
  replaced: "Substituído",
};

export const documentUploadedByLabels: Record<DocumentUploadedBy, string> = {
  supplier: "Supplier",
  buyer: "Comprador",
  backoffice: "Backoffice",
};

export const requirementStatusLabels: Record<RequirementStatus, string> = {
  open: "Aberta",
  in_resolution: "Em resolução",
  resolved: "Resolvida",
};

export const billingStatusLabels: Record<BillingStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  waived: "Isento",
};
