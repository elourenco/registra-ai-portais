import {
  type AvailabilityItem,
  availabilityItemSchema,
  type DevelopmentRegistrationFormInput,
  type DevelopmentRegistrationFormValues,
  type DevelopmentRegistrationStatus,
  type DevelopmentRegistrationType,
  developmentRegistrationStatusLabels,
  developmentRegistrationTypeLabels,
  formatCnpj,
  formatCpfInput,
  formatCurrencyInput,
  formatPhoneInput,
  isRegistrationDocumentType,
  isValidCpf,
  type MaritalStatus,
  maritalStatusLabels,
  maritalStatusSchema,
  normalizeDigits,
  REGISTRATION_DOCUMENT_TYPE_LABELS,
} from "@registra/shared";
import { z } from "zod";

function pickText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(Math.trunc(value));
    }
  }

  return null;
}

function pickNumber(fallback: number, ...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.trunc(value);
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return Math.trunc(parsed);
      }
    }
  }

  return fallback;
}

function pickBoolean(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      if (value === "true") {
        return true;
      }

      if (value === "false") {
        return false;
      }
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatCurrencyValue(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function normalizeCurrencyLabel(...values: unknown[]): string | null {
  const numericValue = values.find(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );

  if (numericValue !== undefined) {
    return formatCurrencyValue(numericValue);
  }

  const text = pickText(...values)?.trim();

  if (!text) {
    return null;
  }

  if (text.includes("R$")) {
    const normalizedDigits = text.replace(/\D/g, "");
    const amount = Number(normalizedDigits || "0") / 100;
    return formatCurrencyValue(amount);
  }

  if (/^\d+$/.test(text)) {
    return formatCurrencyValue(Number(text));
  }

  const normalizedNumber = Number(text.replace(/\./g, "").replace(",", "."));

  if (Number.isFinite(normalizedNumber)) {
    return formatCurrencyValue(normalizedNumber);
  }

  return text;
}

const developmentStatusSchema = z.enum(["drafting", "commercialization", "registry", "completed"]);
const developmentTypeSchema = z.enum(["residential", "commercial", "mixed", "land_subdivision"]);
const buyerStatusSchema = z.enum(["pending", "active", "completed", "inactive"]);
const processStatusSchema = z.enum([
  "in_progress",
  "completed",
  "cancelled",
  "waiting_supplier",
  "waiting_registry_office",
  "requirement_open",
  "overdue",
]);

export type DevelopmentListStatus = z.infer<typeof developmentStatusSchema>;
export type BuyerListStatus = z.infer<typeof buyerStatusSchema>;
export type SupplierProcessStatus = z.infer<typeof processStatusSchema>;

export const buyerStatusLabels: Record<BuyerListStatus, string> = {
  pending: "Pendente",
  active: "Ativo",
  completed: "Concluído",
  inactive: "Inativo",
};

export const processStatusLabels: Record<SupplierProcessStatus, string> = {
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  waiting_supplier: "Aguardando supplier",
  waiting_registry_office: "Aguardando cartório",
  requirement_open: "Exigência aberta",
  overdue: "Em atraso",
};

export const acquisitionTypeLabels = {
  cash: "À vista",
  financing: "Financiamento",
  consortium: "Consórcio",
  fgts: "FGTS",
  mixed: "Composição",
} as const;

export type AcquisitionType = keyof typeof acquisitionTypeLabels;

export interface DevelopmentListItem {
  id: string;
  supplierId: string | null;
  name: string;
  developmentType: DevelopmentRegistrationType;
  cnpj: string;
  address: string;
  status: DevelopmentRegistrationStatus;
  buyersCount: number;
}

export interface DevelopmentListResult {
  items: DevelopmentListItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface DevelopmentDetail {
  id: string;
  supplierId: string | null;
  supplierCustomName: string | null;
  name: string;
  developmentType: DevelopmentRegistrationType;
  speCnpj: string;
  legalName: string;
  tradeName: string;
  incorporationRegistrationNumber: string;
  incorporationRegistrationDate: string;
  masterRegistrationNumber: string;
  postalCode: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  registryOfficeName: string;
  registryOfficeNumber: string;
  registryOfficeCity: string;
  registryOfficeState: string;
  totalUnits: number;
  totalTowers: number;
  parkingSpots: number;
  status: DevelopmentRegistrationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DevelopmentBuyer {
  id: string;
  supplierId: string | null;
  developmentId: string | null;
  availabilityItemId: string | null;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  maritalStatus: MaritalStatus | null;
  hasEnotariadoCertificate: boolean | null;
  spouseName: string | null;
  nationality: string | null;
  profession: string | null;
  unitLabel: string | null;
  acquisitionType: AcquisitionType | null;
  purchaseValue: string | null;
  contractDate: string | null;
  notes: string | null;
  status: BuyerListStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DevelopmentProcess {
  id: string;
  supplierCompanyId: string;
  developmentId: string | null;
  developmentName: string | null;
  buyerId: string | null;
  buyerName: string | null;
  propertyLabel: string;
  registrationNumber: string | null;
  status: SupplierProcessStatus;
  workflowName: string | null;
  stageName: string | null;
  waitingOn: string | null;
  pendingRequirements: number;
  createdAt: string;
  updatedAt: string;
}

export interface DevelopmentDetailResult {
  development: DevelopmentDetail;
  supplier: {
    id: string | null;
    name: string;
    cnpj: string | null;
    status: string | null;
  } | null;
  buyers: DevelopmentBuyer[];
  processes: DevelopmentProcess[];
}

export interface DevelopmentBuyerDetailDevelopment {
  id: string;
  name: string;
  cnpj: string;
  status: DevelopmentRegistrationStatus;
}

export interface DevelopmentBuyerDetailProcess {
  id: string;
  name: string;
  status: SupplierProcessStatus;
  stageId: string | null;
  stageName: string | null;
  createdAt: string;
  updatedAt: string;
}

const workflowProcessStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
  "cancelled",
]);
const workflowStageStatusSchema = z.enum(["pending", "in_progress", "completed"]);
const workflowDocumentStatusSchema = z.enum([
  "uploaded",
  "under_review",
  "approved",
  "rejected",
  "replaced",
]);
const contractControlStatusSchema = z.enum([
  "pending_generation",
  "awaiting_document_upload",
  "awaiting_signature",
  "signed",
  "completed",
  "cancelled",
]);

export type SupplierWorkflowProcessStatus = z.infer<typeof workflowProcessStatusSchema>;
export type SupplierWorkflowStageStatus = z.infer<typeof workflowStageStatusSchema>;
export type SupplierWorkflowDocumentStatus = z.infer<typeof workflowDocumentStatusSchema>;
export type SupplierContractControlStatus = z.infer<typeof contractControlStatusSchema>;

export interface SupplierWorkflowProcessDocument {
  id: string;
  processId: string;
  requestId: string | null;
  workflowStageId: string | null;
  supplierId: string | null;
  block: string | null;
  type: string;
  uploadedBy: string | null;
  originalFileName: string | null;
  mimeType: string | null;
  fileSize: number;
  version: number;
  status: SupplierWorkflowDocumentStatus;
  comments: string | null;
  metadata: {
    deedRegistrationNumber?: string | null;
  };
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SupplierWorkflowStageNote {
  id: string;
  processId: string;
  stageId: string;
  note: string;
  createdAt: string | null;
  createdBy: {
    id: string | null;
    name: string | null;
  } | null;
}

export interface SupplierWorkflowStageContractControl {
  signatureUrl: string | null;
  status: SupplierContractControlStatus;
  updatedAt: string | null;
  updatedBy: {
    id: string | null;
    name: string | null;
  } | null;
}

export interface SupplierWorkflowStageProcess {
  id: string;
  supplierCompanyId: string | null;
  workflowId: string | null;
  stageId: string | null;
  name: string | null;
  status: SupplierWorkflowProcessStatus;
  createdByUserId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  completedAt: string | null;
  documents: SupplierWorkflowProcessDocument[];
  contractControl: SupplierWorkflowStageContractControl | null;
}

export interface SupplierWorkflowStage {
  id: string;
  workflowId: string | null;
  name: string;
  description: string | null;
  order: number;
  status: SupplierWorkflowStageStatus;
  notes: SupplierWorkflowStageNote[];
  process: SupplierWorkflowStageProcess | null;
}

export interface SupplierWorkflowProcessDetail {
  id: string;
  supplierCompanyId: string | null;
  workflowId: string | null;
  stageId: string | null;
  status: SupplierWorkflowProcessStatus;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  buyer: DevelopmentBuyer | null;
  workflow: {
    id: string | null;
    name: string | null;
  };
  stages: SupplierWorkflowStage[];
}

export const workflowProcessStatusLabels: Record<SupplierWorkflowProcessStatus, string> = {
  not_started: "Não iniciado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const workflowStageStatusLabels: Record<SupplierWorkflowStageStatus, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluído",
};

export const contractControlStatusLabels: Record<SupplierContractControlStatus, string> = {
  pending_generation: "Aguardando preparação",
  awaiting_document_upload: "Aguardando envio do contrato",
  awaiting_signature: "Aguardando assinatura",
  signed: "Assinado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export interface DevelopmentBuyerDetailResult {
  buyer: DevelopmentBuyer;
  availabilityItem: AvailabilityItem | null;
  supplier: {
    id: string | null;
    name: string;
    cnpj: string | null;
    status: string | null;
  } | null;
  development: DevelopmentBuyerDetailDevelopment;
  processes: DevelopmentBuyerDetailProcess[];
  process: DevelopmentBuyerDetailProcess | null;
  recentSubmissions: Record<string, unknown>[];
}

export const buyerRegistrationFormSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome do comprador."),
  cpf: z
    .string()
    .trim()
    .min(1, "Informe o CPF.")
    .refine((value) => isValidCpf(value), "Informe um CPF válido."),
  email: z.string().trim().email("Informe um e-mail válido."),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      const digits = normalizeDigits(value);
      return digits.length >= 10 && digits.length <= 11;
    }, "Informe um telefone válido."),
  maritalStatus: maritalStatusSchema,
  nationality: z.string().trim().min(2, "Informe a nacionalidade."),
  profession: z.string().trim().min(2, "Informe a profissão."),
  availabilityItemId: z.string().trim().optional(),
  unitLabel: z.string().trim().min(1, "Informe a unidade ou lote."),
  acquisitionType: z.enum(["cash", "financing", "consortium", "fgts", "mixed"]),
  purchaseValue: z.string().trim().min(1, "Informe o valor da compra."),
  contractDate: z.string().trim().min(1, "Informe a data do contrato."),
  notes: z.string().trim().optional(),
});

export type BuyerRegistrationFormInput = z.input<typeof buyerRegistrationFormSchema>;
export type BuyerRegistrationFormValues = z.output<typeof buyerRegistrationFormSchema>;

export const buyerUpdateFormSchema = z.object({
  maritalStatus: z
    .union([maritalStatusSchema, z.literal("")])
    .transform((value) => (value === "" ? null : value)),
  hasEnotariadoCertificate: z.boolean(),
  spouseName: z.string().trim().optional(),
});

export type BuyerUpdateFormInput = z.input<typeof buyerUpdateFormSchema>;
export type BuyerUpdateFormValues = z.output<typeof buyerUpdateFormSchema>;

function normalizeDevelopmentStatus(value: unknown): DevelopmentRegistrationStatus {
  const parsed = developmentStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : "drafting";
}

function normalizeDevelopmentType(value: unknown): DevelopmentRegistrationType {
  const parsed = developmentTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : "residential";
}

function normalizeBuyerStatus(value: unknown): BuyerListStatus {
  const parsed = buyerStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : "pending";
}

function normalizeProcessStatus(value: unknown): SupplierProcessStatus {
  if (typeof value !== "string") {
    return "in_progress";
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "done") {
    return "completed";
  }

  const parsed = processStatusSchema.safeParse(normalized);
  return parsed.success ? parsed.data : "in_progress";
}

function normalizeWorkflowProcessStatus(value: unknown): SupplierWorkflowProcessStatus {
  if (typeof value !== "string") {
    return "in_progress";
  }

  const normalized = value.trim().toLowerCase();
  const parsed = workflowProcessStatusSchema.safeParse(normalized);
  return parsed.success ? parsed.data : "in_progress";
}

function normalizeWorkflowStageStatus(value: unknown): SupplierWorkflowStageStatus {
  const parsed = workflowStageStatusSchema.safeParse(pickText(value)?.toLowerCase());
  return parsed.success ? parsed.data : "pending";
}

function normalizeWorkflowDocumentStatus(value: unknown): SupplierWorkflowDocumentStatus {
  const parsed = workflowDocumentStatusSchema.safeParse(pickText(value)?.toLowerCase());
  return parsed.success ? parsed.data : "uploaded";
}

function normalizeContractControlStatus(value: unknown): SupplierContractControlStatus {
  const parsed = contractControlStatusSchema.safeParse(pickText(value)?.toLowerCase());
  return parsed.success ? parsed.data : "pending_generation";
}

export function toDevelopmentListResult(
  response: unknown,
  page: number,
  limit: number,
): DevelopmentListResult {
  const payload = isRecord(response) ? response : {};
  const items = Array.isArray(payload.items) ? payload.items : [];
  const pagination = isRecord(payload.pagination) ? payload.pagination : {};

  return {
    items: items.map((item, index) => {
      const source = isRecord(item) ? item : {};

      return {
        id: pickText(source.id) ?? `development-${index}`,
        supplierId: pickText(source.supplierId),
        name: pickText(source.name) ?? "Empreendimento",
        developmentType: normalizeDevelopmentType(source.developmentType),
        cnpj: formatCnpj(pickText(source.cnpj, source.speCnpj) ?? ""),
        address: pickText(source.address) ?? "-",
        status: normalizeDevelopmentStatus(source.status),
        buyersCount: Math.max(0, pickNumber(0, source.buyersCount)),
      };
    }),
    pagination: {
      page: Math.max(1, pickNumber(page, pagination.page)),
      limit: Math.max(1, pickNumber(limit, pagination.limit)),
      totalItems: Math.max(0, pickNumber(items.length, pagination.totalItems, pagination.total)),
      totalPages: Math.max(1, pickNumber(1, pagination.totalPages)),
      hasNextPage: Boolean(pagination.hasNextPage),
      hasPreviousPage: Boolean(pagination.hasPreviousPage),
    },
  };
}

function toDevelopmentDetail(response: unknown): DevelopmentDetail {
  const source = isRecord(response) ? response : {};

  return {
    id: pickText(source.id) ?? "",
    supplierId: pickText(source.supplierId),
    supplierCustomName: pickText(source.supplierCustomName),
    name: pickText(source.name) ?? "Empreendimento",
    developmentType: normalizeDevelopmentType(source.developmentType),
    speCnpj: formatCnpj(pickText(source.speCnpj) ?? ""),
    legalName: pickText(source.legalName) ?? "",
    tradeName: pickText(source.tradeName) ?? "",
    incorporationRegistrationNumber: pickText(source.incorporationRegistrationNumber) ?? "",
    incorporationRegistrationDate: pickText(source.incorporationRegistrationDate) ?? "",
    masterRegistrationNumber: pickText(source.masterRegistrationNumber) ?? "",
    postalCode: pickText(source.postalCode) ?? "",
    address: pickText(source.address) ?? "",
    number: pickText(source.number) ?? "",
    complement: pickText(source.complement) ?? "",
    neighborhood: pickText(source.neighborhood) ?? "",
    city: pickText(source.city) ?? "",
    state: pickText(source.state) ?? "SP",
    registryOfficeName: pickText(source.registryOfficeName) ?? "",
    registryOfficeNumber: pickText(source.registryOfficeNumber) ?? "",
    registryOfficeCity: pickText(source.registryOfficeCity) ?? "",
    registryOfficeState: pickText(source.registryOfficeState) ?? "SP",
    totalUnits: Math.max(1, pickNumber(1, source.totalUnits)),
    totalTowers: Math.max(1, pickNumber(1, source.totalTowers)),
    parkingSpots: Math.max(0, pickNumber(0, source.parkingSpots)),
    status: normalizeDevelopmentStatus(source.status),
    createdAt: pickText(source.createdAt) ?? new Date().toISOString(),
    updatedAt: pickText(source.updatedAt, source.createdAt) ?? new Date().toISOString(),
  };
}

function toBuyer(item: unknown, index: number): DevelopmentBuyer {
  const source = isRecord(item) ? item : {};
  const rawAcquisitionType = pickText(source.acquisitionType);
  const maritalStatus = pickText(source.maritalStatus);
  const acquisitionType = rawAcquisitionType === "financed" ? "financing" : rawAcquisitionType;

  return {
    id: pickText(source.id) ?? `buyer-${index}`,
    supplierId: pickText(source.supplierId),
    developmentId: pickText(source.developmentId),
    availabilityItemId: pickText(source.availabilityItemId),
    name: pickText(source.name, source.fullName) ?? "Comprador",
    cpf: formatCpfInput(pickText(source.cpf) ?? ""),
    email: pickText(source.email) ?? "-",
    phone: formatPhoneInput(pickText(source.phone) ?? ""),
    maritalStatus: maritalStatusSchema.safeParse(maritalStatus).success
      ? (maritalStatus as MaritalStatus)
      : null,
    hasEnotariadoCertificate: pickBoolean(source.hasEnotariadoCertificate),
    spouseName: pickText(source.spouseName),
    nationality: pickText(source.nationality),
    profession: pickText(source.profession),
    unitLabel: pickText(source.unitLabel),
    acquisitionType:
      acquisitionType && acquisitionType in acquisitionTypeLabels
        ? (acquisitionType as AcquisitionType)
        : null,
    purchaseValue: normalizeCurrencyLabel(
      source.purchaseValue,
      source.purchase_price,
      source.amount,
    ),
    contractDate: pickText(source.contractDate, source.contract_date),
    notes: pickText(source.notes, source.observation, source.comments),
    status: normalizeBuyerStatus(source.status),
    createdAt: pickText(source.createdAt) ?? new Date().toISOString(),
    updatedAt: pickText(source.updatedAt, source.createdAt) ?? new Date().toISOString(),
  };
}

function toProcess(item: unknown, index: number): DevelopmentProcess {
  const source = isRecord(item) ? item : {};

  return {
    id: pickText(source.id) ?? `process-${index}`,
    supplierCompanyId: pickText(source.supplierCompanyId, source.supplierId) ?? "",
    developmentId: pickText(source.developmentId),
    developmentName: pickText(source.developmentName),
    buyerId: pickText(source.buyerId),
    buyerName: pickText(source.buyerName),
    propertyLabel: pickText(source.propertyLabel, source.name, source.title) ?? "Processo",
    registrationNumber: pickText(source.registrationNumber),
    status: normalizeProcessStatus(source.status),
    workflowName: pickText(
      source.workflowName,
      isRecord(source.workflow) ? source.workflow.name : null,
    ),
    stageName: pickText(
      source.stageName,
      source.currentStageName,
      source.currentStepName,
      source.stepName,
      isRecord(source.currentStage) ? source.currentStage.name : null,
    ),
    waitingOn: pickText(source.waitingOn),
    pendingRequirements: Math.max(0, pickNumber(0, source.pendingRequirements)),
    createdAt: pickText(source.createdAt) ?? new Date().toISOString(),
    updatedAt: pickText(source.updatedAt, source.createdAt) ?? new Date().toISOString(),
  };
}

function toBuyerDetailDevelopment(item: unknown): DevelopmentBuyerDetailDevelopment {
  const source = isRecord(item) ? item : {};

  return {
    id: pickText(source.id) ?? "",
    name: pickText(source.name) ?? "Empreendimento",
    cnpj: formatCnpj(pickText(source.cnpj) ?? ""),
    status: normalizeDevelopmentStatus(source.status),
  };
}

function toBuyerDetailProcess(item: unknown): DevelopmentBuyerDetailProcess | null {
  if (!isRecord(item)) {
    return null;
  }

  return {
    id: pickText(item.id) ?? "",
    name: pickText(item.name) ?? "Processo",
    status: normalizeProcessStatus(item.status),
    stageId: pickText(
      item.stageId,
      item.currentStageId,
      isRecord(item.currentStage) ? item.currentStage.id : null,
    ),
    stageName: pickText(
      item.stageName,
      item.currentStageName,
      item.currentStepName,
      item.stepName,
      isRecord(item.currentStage) ? item.currentStage.name : null,
    ),
    createdAt: pickText(item.createdAt) ?? new Date().toISOString(),
    updatedAt: pickText(item.updatedAt, item.createdAt) ?? new Date().toISOString(),
  };
}

function toSupplierWorkflowStageNote(item: unknown): SupplierWorkflowStageNote {
  const source = isRecord(item) ? item : {};
  const createdBy = isRecord(source.createdBy) ? source.createdBy : null;

  return {
    id: pickText(source.id) ?? "",
    processId: pickText(source.processId) ?? "",
    stageId: pickText(source.stageId) ?? "",
    note: pickText(source.note) ?? "",
    createdAt: pickText(source.createdAt),
    createdBy: createdBy
      ? {
          id: pickText(createdBy.id),
          name: pickText(createdBy.name),
        }
      : null,
  };
}

function toSupplierWorkflowProcessDocument(item: unknown): SupplierWorkflowProcessDocument {
  const source = isRecord(item) ? item : {};
  const metadata = isRecord(source.metadata) ? source.metadata : {};

  return {
    id: pickText(source.id) ?? "",
    processId: pickText(source.processId) ?? "",
    requestId: pickText(source.requestId),
    workflowStageId: pickText(source.workflowStageId),
    supplierId: pickText(source.supplierId),
    block: pickText(source.block),
    type: pickText(source.type, source.name) ?? "Documento",
    uploadedBy: pickText(source.uploadedBy),
    originalFileName: pickText(source.originalFileName),
    mimeType: pickText(source.mimeType),
    fileSize: Math.max(0, pickNumber(0, source.fileSize)),
    version: Math.max(1, pickNumber(1, source.version)),
    status: normalizeWorkflowDocumentStatus(source.status),
    comments: pickText(source.comments),
    metadata: {
      deedRegistrationNumber: pickText(metadata.deedRegistrationNumber),
    },
    createdAt: pickText(source.createdAt),
    updatedAt: pickText(source.updatedAt),
  };
}

export function getSupplierWorkflowDocumentTypeLabel(type: string) {
  return isRegistrationDocumentType(type) ? REGISTRATION_DOCUMENT_TYPE_LABELS[type] : type;
}

function toSupplierWorkflowStageContractControl(
  item: unknown,
): SupplierWorkflowStageContractControl | null {
  if (!isRecord(item)) {
    return null;
  }

  const updatedBy = isRecord(item.updatedBy) ? item.updatedBy : null;

  return {
    signatureUrl: pickText(item.signatureUrl),
    status: normalizeContractControlStatus(item.status),
    updatedAt: pickText(item.updatedAt),
    updatedBy: updatedBy
      ? {
          id: pickText(updatedBy.id),
          name: pickText(updatedBy.name),
        }
      : null,
  };
}

function toSupplierWorkflowStageProcess(item: unknown): SupplierWorkflowStageProcess | null {
  if (!isRecord(item)) {
    return null;
  }

  return {
    id: pickText(item.id) ?? "",
    supplierCompanyId: pickText(item.supplierCompanyId),
    workflowId: pickText(item.workflowId),
    stageId: pickText(item.stageId),
    name: pickText(item.name),
    status: normalizeWorkflowProcessStatus(item.status),
    createdByUserId: pickText(item.createdByUserId),
    createdAt: pickText(item.createdAt),
    updatedAt: pickText(item.updatedAt),
    completedAt: pickText(item.completedAt),
    documents: Array.isArray(item.documents)
      ? item.documents.map(toSupplierWorkflowProcessDocument)
      : [],
    contractControl: toSupplierWorkflowStageContractControl(item.contractControl),
  };
}

function toSupplierWorkflowStage(item: unknown, index: number): SupplierWorkflowStage {
  const source = isRecord(item) ? item : {};

  return {
    id: pickText(source.id) ?? `stage-${index}`,
    workflowId: pickText(source.workflowId),
    name: pickText(source.name) ?? `Etapa ${index + 1}`,
    description: pickText(source.description),
    order: Math.max(1, pickNumber(index + 1, source.order)),
    status: normalizeWorkflowStageStatus(source.status),
    notes: Array.isArray(source.notes) ? source.notes.map(toSupplierWorkflowStageNote) : [],
    process: toSupplierWorkflowStageProcess(source.process),
  };
}

function pickRecordFromKeys(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (isRecord(value)) {
      return value;
    }
  }

  return null;
}

function pickProcessList(payload: Record<string, unknown>) {
  if (Array.isArray(payload.processes)) {
    return payload.processes;
  }

  const process = toBuyerDetailProcess(payload.process);
  return process ? [process] : [];
}

export function toDevelopmentDetailResult(response: unknown): DevelopmentDetailResult {
  const payload = isRecord(response) ? response : {};
  const supplierPayload = isRecord(payload.supplier) ? payload.supplier : null;

  return {
    development: toDevelopmentDetail(isRecord(payload.development) ? payload.development : payload),
    supplier: supplierPayload
      ? {
          id: pickText(supplierPayload.id),
          name: pickText(supplierPayload.name) ?? "Supplier",
          cnpj: pickText(supplierPayload.cnpj),
          status: pickText(supplierPayload.status),
        }
      : null,
    buyers: (Array.isArray(payload.buyers) ? payload.buyers : []).map(toBuyer),
    processes: (Array.isArray(payload.processes) ? payload.processes : []).map(toProcess),
  };
}

export function toDevelopmentBuyerDetailResult(response: unknown): DevelopmentBuyerDetailResult {
  const payload = isRecord(response) ? response : {};
  const root = pickRecordFromKeys(payload, ["data", "item", "buyerDetail"]) ?? payload;
  const supplierPayload = isRecord(root.supplier) ? root.supplier : null;
  const availabilityItem =
    root.availabilityItem == null
      ? null
      : availabilityItemSchema.safeParse(root.availabilityItem).success
        ? availabilityItemSchema.parse(root.availabilityItem)
        : null;
  const processes = pickProcessList(root);

  return {
    buyer: toBuyer(root.buyer, 0),
    availabilityItem,
    supplier: supplierPayload
      ? {
          id: pickText(supplierPayload.id),
          name: pickText(supplierPayload.name) ?? "Supplier",
          cnpj: pickText(supplierPayload.cnpj),
          status: pickText(supplierPayload.status),
        }
      : null,
    development: toBuyerDetailDevelopment(root.development),
    processes,
    process: processes[0] ?? null,
    recentSubmissions: Array.isArray(root.recentSubmissions)
      ? root.recentSubmissions.filter(isRecord)
      : [],
  };
}

export function toSupplierWorkflowProcessDetailResult(
  response: unknown,
): SupplierWorkflowProcessDetail {
  const payload = isRecord(response) ? response : {};
  const root =
    (isRecord(payload.data) && payload.data) ||
    (isRecord(payload.item) && payload.item) ||
    (isRecord(payload.process) && payload.process) ||
    payload;
  const workflow = isRecord(root.workflow) ? root.workflow : {};

  return {
    id: pickText(root.id) ?? "",
    supplierCompanyId: pickText(root.supplierCompanyId),
    workflowId: pickText(root.workflowId, workflow.id),
    stageId: pickText(root.stageId),
    status: normalizeWorkflowProcessStatus(root.status),
    createdByUserId: pickText(root.createdByUserId),
    createdAt: pickText(root.createdAt) ?? new Date().toISOString(),
    updatedAt: pickText(root.updatedAt, root.createdAt) ?? new Date().toISOString(),
    completedAt: pickText(root.completedAt),
    buyer: isRecord(root.buyer) ? toBuyer(root.buyer, 0) : null,
    workflow: {
      id: pickText(workflow.id),
      name: pickText(workflow.name),
    },
    stages: Array.isArray(root.stages) ? root.stages.map(toSupplierWorkflowStage) : [],
  };
}

export function toDevelopmentFormValues(
  development: DevelopmentDetail,
): DevelopmentRegistrationFormInput {
  return {
    name: development.name,
    developmentType: development.developmentType,
    speCnpj: development.speCnpj,
    legalName: development.legalName,
    tradeName: development.tradeName,
    supplierId: development.supplierId ?? "",
    supplierCustomName: development.supplierCustomName ?? "",
    incorporationRegistrationNumber: development.incorporationRegistrationNumber,
    incorporationRegistrationDate: development.incorporationRegistrationDate,
    masterRegistrationNumber: development.masterRegistrationNumber,
    postalCode: development.postalCode,
    address: development.address,
    number: development.number,
    complement: development.complement,
    neighborhood: development.neighborhood,
    city: development.city,
    state: development.state as DevelopmentRegistrationFormValues["state"],
    registryOfficeName: development.registryOfficeName,
    registryOfficeNumber: development.registryOfficeNumber,
    registryOfficeCity: development.registryOfficeCity,
    registryOfficeState:
      development.registryOfficeState as DevelopmentRegistrationFormValues["registryOfficeState"],
    totalUnits: development.totalUnits,
    totalTowers: development.totalTowers,
    parkingSpots: development.parkingSpots,
    status: development.status,
  };
}

export function buildDevelopmentAddress(development: DevelopmentDetail): string {
  return [
    development.address,
    development.number,
    development.neighborhood,
    `${development.city}/${development.state}`,
  ]
    .filter(Boolean)
    .join(", ");
}

export function formatBuyerPurchaseValue(value: string): string {
  return formatCurrencyInput(value);
}

export function toBuyerUpdateFormValues(buyer: DevelopmentBuyer): BuyerUpdateFormInput {
  return {
    maritalStatus: buyer.maritalStatus ?? "",
    hasEnotariadoCertificate: buyer.hasEnotariadoCertificate ?? false,
    spouseName: buyer.spouseName ?? "",
  };
}

export const developmentTypeLabels = developmentRegistrationTypeLabels;
export const developmentStatusLabels = developmentRegistrationStatusLabels;
export const maritalLabels: Record<MaritalStatus, string> = maritalStatusLabels;
