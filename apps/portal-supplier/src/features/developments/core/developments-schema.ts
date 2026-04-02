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
  isValidCpf,
  type MaritalStatus,
  maritalStatusLabels,
  maritalStatusSchema,
  normalizeDigits,
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
  currentStageName: string | null;
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
  currentStageId: string | null;
  currentStageName: string | null;
  createdAt: string;
  updatedAt: string;
}

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
    currentStageName: pickText(
      source.currentStageName,
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
    currentStageId: pickText(item.currentStageId),
    currentStageName: pickText(item.currentStageName),
    createdAt: pickText(item.createdAt) ?? new Date().toISOString(),
    updatedAt: pickText(item.updatedAt, item.createdAt) ?? new Date().toISOString(),
  };
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
  const supplierPayload = isRecord(payload.supplier) ? payload.supplier : null;
  const availabilityItem =
    payload.availabilityItem == null
      ? null
      : availabilityItemSchema.safeParse(payload.availabilityItem).success
        ? availabilityItemSchema.parse(payload.availabilityItem)
        : null;

  return {
    buyer: toBuyer(payload.buyer, 0),
    availabilityItem,
    supplier: supplierPayload
      ? {
          id: pickText(supplierPayload.id),
          name: pickText(supplierPayload.name) ?? "Supplier",
          cnpj: pickText(supplierPayload.cnpj),
          status: pickText(supplierPayload.status),
        }
      : null,
    development: toBuyerDetailDevelopment(payload.development),
    process: toBuyerDetailProcess(payload.process),
    recentSubmissions: Array.isArray(payload.recentSubmissions)
      ? payload.recentSubmissions.filter(isRecord)
      : [],
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
