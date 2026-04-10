import {
  type ProcessDetail,
  type ProcessListItem,
  type ProcessListStatus,
  type ProcessStageNote,
  processDetailSchema,
  processListItemSchema,
  processListResultSchema,
  type WorkflowProcessDocumentStatus,
  type WorkflowStageDocument,
  type WorkflowStageProcess,
} from "@/features/processes/core/process-schema";
import { isRecord, pickBoolean, pickNumber, pickText } from "@/shared/utils/api-normalizers";

function toProcessStatus(value: unknown): ProcessListStatus {
  if (typeof value !== "string") {
    return "in_progress";
  }

  switch (value.trim().toLowerCase()) {
    case "completed":
    case "done":
      return "completed";
    case "cancelled":
    case "canceled":
    case "blocked":
      return "cancelled";
    default:
      return "in_progress";
  }
}

function pickProcessPayload(response: unknown): Record<string, unknown> {
  if (!isRecord(response)) {
    return {};
  }

  for (const key of ["data", "item", "process", "detail"]) {
    if (isRecord(response[key])) {
      return response[key];
    }
  }

  return response;
}

function buildWorkflowName(payload: Record<string, unknown>): string | null {
  if (isRecord(payload.workflow)) {
    return pickText(payload.workflow.name, payload.workflow.title);
  }

  const workflowId = pickText(payload.workflowId);
  return workflowId ? `Workflow #${workflowId}` : null;
}

function buildStageId(payload: Record<string, unknown>): string | null {
  return pickText(
    payload.stageId,
    payload.currentStageId,
    isRecord(payload.currentStage) ? payload.currentStage.id : null,
  );
}

function buildStageName(payload: Record<string, unknown>): string | null {
  const stageName = pickText(
    payload.stageName,
    payload.currentStageName,
    isRecord(payload.currentStage) ? payload.currentStage.name : null,
    isRecord(payload.currentStage) ? payload.currentStage.title : null,
  );

  if (stageName) {
    return stageName;
  }

  if (isRecord(payload.currentStage)) {
    return pickText(payload.currentStage.name, payload.currentStage.title);
  }

  if (Array.isArray(payload.stages)) {
    const activeStage = payload.stages.find(
      (stage) => isRecord(stage) && pickText(stage.status) === "in_progress",
    );

    if (isRecord(activeStage)) {
      return pickText(activeStage.name, activeStage.title);
    }
  }

  const stageId = buildStageId(payload);
  return stageId ? `Etapa #${stageId}` : null;
}

function pickSupplierDisplayName(payload: Record<string, unknown>): string | null {
  if (isRecord(payload.supplier)) {
    return pickText(
      payload.supplier.legalName,
      payload.supplier.tradeName,
      payload.supplier.companyName,
      payload.supplier.razaoSocial,
      payload.supplier.name,
    );
  }

  return pickText(
    payload.supplierName,
    payload.clientName,
    payload.customerName,
    payload.companyName,
    payload.legalName,
    payload.razaoSocial,
  );
}

function normalizeProcessRule(rule: unknown) {
  const payload = isRecord(rule) ? rule : {};

  return {
    id: pickText(payload.id) ?? "",
    name: pickText(payload.name, payload.title) ?? "",
    status: pickText(payload.status) === "completed" ? "completed" : "pending",
    completedAt: pickText(payload.completedAt),
    evidence: pickText(payload.evidence),
  };
}

function normalizeProcessStageNote(note: unknown): ProcessStageNote {
  const payload = isRecord(note) ? note : {};
  const createdBy = isRecord(payload.createdBy) ? payload.createdBy : null;

  return {
    id: pickText(payload.id) ?? "",
    processId: pickText(payload.processId) ?? "",
    stageId: pickText(payload.stageId) ?? "",
    note: pickText(payload.note) ?? "",
    createdAt: pickText(payload.createdAt) ?? undefined,
    createdBy: createdBy
      ? {
          id: pickText(createdBy.id) ?? undefined,
          name: pickText(createdBy.name) ?? undefined,
        }
      : null,
  };
}

const WORKFLOW_DOCUMENT_STATUSES: WorkflowProcessDocumentStatus[] = [
  "uploaded",
  "under_review",
  "approved",
  "rejected",
  "replaced",
];

function normalizeWorkflowDocumentStatus(value: unknown): WorkflowProcessDocumentStatus {
  const raw = pickText(value)?.toLowerCase() ?? "";
  const match = WORKFLOW_DOCUMENT_STATUSES.find((item) => item === raw);
  return match ?? "uploaded";
}

function normalizeWorkflowDocument(doc: unknown): WorkflowStageDocument {
  const payload = isRecord(doc) ? doc : {};

  return {
    id: pickText(payload.id) ?? "0",
    processId: pickText(payload.processId) ?? "",
    requestId: pickText(payload.requestId),
    workflowStageId: pickText(payload.workflowStageId),
    supplierId: pickText(payload.supplierId) ?? undefined,
    block: pickText(payload.block) ?? undefined,
    type: pickText(payload.type, payload.name) ?? "Documento",
    uploadedBy: pickText(payload.uploadedBy) ?? undefined,
    originalFileName: pickText(payload.originalFileName) ?? undefined,
    mimeType: pickText(payload.mimeType) ?? undefined,
    fileSize: pickNumber(0, payload.fileSize),
    version: pickNumber(1, payload.version),
    status: normalizeWorkflowDocumentStatus(payload.status),
    comments: pickText(payload.comments),
    createdAt: pickText(payload.createdAt) ?? undefined,
    updatedAt: pickText(payload.updatedAt) ?? undefined,
  };
}

function normalizeWorkflowStageProcess(value: unknown): WorkflowStageProcess | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = pickText(value.id);
  if (!id) {
    return null;
  }

  return {
    id,
    supplierCompanyId: pickText(value.supplierCompanyId) ?? undefined,
    workflowId: pickText(value.workflowId) ?? undefined,
    stageId: pickText(value.stageId),
    name: pickText(value.name) ?? undefined,
    status: pickText(value.status) ?? undefined,
    createdByUserId: pickText(value.createdByUserId) ?? undefined,
    createdAt: pickText(value.createdAt) ?? undefined,
    updatedAt: pickText(value.updatedAt) ?? undefined,
    completedAt: pickText(value.completedAt),
    documents: Array.isArray(value.documents) ? value.documents.map(normalizeWorkflowDocument) : [],
  };
}

function normalizeProcessDetailBuyer(value: unknown): ProcessDetail["buyer"] {
  if (value === null || value === undefined) {
    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const cert = value.hasEnotariadoCertificate;
  const addressObj = isRecord(value.address) ? value.address : value;

  return {
    id: pickText(value.id) ?? undefined,
    name: pickText(value.name) ?? undefined,
    hasEnotariadoCertificate: typeof cert === "boolean" ? cert : cert === null ? null : null,
    email: pickText(value.email) ?? undefined,
    phone: pickText(value.phone, value.phoneNumber) ?? undefined,
    cpf: pickText(value.cpf) ?? undefined,
    street: pickText(addressObj.street, addressObj.address, value.street) ?? undefined,
    number: pickText(addressObj.number, value.number) ?? null,
    complement: pickText(addressObj.complement, value.complement) ?? null,
    neighborhood: pickText(addressObj.neighborhood, addressObj.district, value.neighborhood) ?? null,
    city: pickText(addressObj.city, value.city) ?? undefined,
    state: pickText(addressObj.state, value.state) ?? undefined,
    postalCode: pickText(addressObj.postalCode, addressObj.zipCode, value.postalCode, value.zipCode) ?? undefined,
    address: typeof value.address === "string" ? value.address : undefined,
    maritalStatus: pickText(value.maritalStatus) ?? undefined,
    spouseName: pickText(value.spouseName) ?? null,
    spouseCpf: pickText(value.spouseCpf) ?? null,
    unitLabel: pickText(value.unitLabel) ?? null,
    acquisitionType: pickText(value.acquisitionType) ?? null,
    processId: pickText(value.processId) ?? null,
    basicDataConfirmedAt: pickText(value.basicDataConfirmedAt) ?? null,
  };
}

function normalizeProcessStage(stage: unknown) {
  const payload = isRecord(stage) ? stage : {};
  const processRaw = payload.process;
  const process =
    processRaw === undefined
      ? undefined
      : processRaw === null
        ? null
        : normalizeWorkflowStageProcess(processRaw);

  return {
    id: pickText(payload.id) ?? "",
    workflowId: pickText(payload.workflowId) ?? "",
    name: pickText(payload.name, payload.title) ?? "",
    description: pickText(payload.description),
    order: pickNumber(1, payload.order),
    status:
      pickText(payload.status) === "completed"
        ? "completed"
        : pickText(payload.status) === "in_progress"
          ? "in_progress"
          : "pending",
    rules: Array.isArray(payload.rules) ? payload.rules.map(normalizeProcessRule) : [],
    notes: Array.isArray(payload.notes) ? payload.notes.map(normalizeProcessStageNote) : [],
    process,
  };
}

export function resolveProcessesListPath(supplierId?: string, status?: string): string {
  const endpoint =
    import.meta.env.VITE_BACKOFFICE_PROCESSES_ENDPOINT ?? "/api/v1/backoffice/processes";

  const [path, queryString = ""] = endpoint.split("?");
  const searchParams = new URLSearchParams(queryString);

  if (status) {
    searchParams.set("status", status);
  } else {
    searchParams.delete("status");
  }

  if (supplierId) {
    searchParams.set("supplierCompanyId", supplierId);
  } else {
    searchParams.delete("supplierCompanyId");
  }

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export function resolveProcessDetailPath(processId: string, supplierId?: string): string {
  const baseEndpoint = supplierId
    ? (import.meta.env.VITE_BACKOFFICE_SUPPLIER_PROCESS_DETAIL_ENDPOINT ??
      "/api/v1/workflows/suppliers/{supplierCompanyId}/processes/{processId}")
    : (import.meta.env.VITE_BACKOFFICE_PROCESS_DETAIL_ENDPOINT ??
      "/api/v1/workflows/processes/{processId}");

  if (supplierId) {
    return baseEndpoint
      .replace("{supplierCompanyId}", encodeURIComponent(supplierId))
      .replace("{processId}", encodeURIComponent(processId));
  }

  if (baseEndpoint.includes("{processId}")) {
    return baseEndpoint.replace("{processId}", encodeURIComponent(processId));
  }

  return `${baseEndpoint.replace(/\/$/, "")}/${encodeURIComponent(processId)}`;
}

export function pickProcessItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!isRecord(response)) {
    return [];
  }

  for (const key of ["items", "data", "results", "processes", "processInstances"]) {
    if (Array.isArray(response[key])) {
      return response[key];
    }
  }

  if (isRecord(response.data)) {
    for (const key of ["items", "results", "processes", "processInstances"]) {
      if (Array.isArray(response.data[key])) {
        return response.data[key];
      }
    }
  }

  return [];
}

export function toProcessListItem(value: unknown): ProcessListItem {
  const payload = pickProcessPayload(value);
  const workflowName = buildWorkflowName(payload);
  const stageId = buildStageId(payload);
  const stageName = buildStageName(payload);

  return processListItemSchema.parse({
    id: pickText(payload.id) ?? "",
    supplierCompanyId:
      pickText(payload.supplierCompanyId, payload.supplierId, payload.companyId) ?? "",
    supplierName: pickSupplierDisplayName(payload),
    developmentId: pickText(payload.developmentId),
    developmentName: pickText(payload.developmentName),
    buyerId: pickText(payload.buyerId),
    buyerName: pickText(payload.buyerName),
    propertyLabel: pickText(payload.propertyLabel, payload.name, payload.title) ?? "",
    registrationNumber: pickText(payload.registrationNumber),
    status: toProcessStatus(payload.status),
    workflowId: pickText(
      payload.workflowId,
      isRecord(payload.workflow) ? payload.workflow.id : null,
    ),
    workflowName,
    stageId,
    stageName,
    pendingRequirements: pickNumber(0, payload.pendingRequirements),
    waitingOn: pickText(payload.waitingOn) ?? null,
    createdAt: pickText(payload.createdAt) ?? "",
    updatedAt: pickText(payload.updatedAt, payload.createdAt) ?? "",
    dueAt: pickText(payload.dueAt),
  });
}

export function toProcessDetail(response: unknown): ProcessDetail {
  const payload = pickProcessPayload(response);
  const workflow = isRecord(payload.workflow)
    ? {
        id: pickText(payload.workflow.id) ?? "",
        name: pickText(payload.workflow.name, payload.workflow.title) ?? "",
      }
    : pickText(payload.workflowId)
      ? {
          id: pickText(payload.workflowId) ?? "",
          name: buildWorkflowName(payload) ?? `Workflow #${pickText(payload.workflowId)}`,
        }
      : null;

  const stages = Array.isArray(payload.stages) ? payload.stages.map(normalizeProcessStage) : [];
  const id = pickText(payload.id) ?? "";
  const name = pickText(payload.name, payload.propertyLabel, payload.title) ?? `Processo #${id}`;
  const supplierCompanyId =
    pickText(payload.supplierCompanyId, payload.supplierId, payload.companyId) ?? "";
  const workflowId = pickText(
    payload.workflowId,
    isRecord(payload.workflow) ? payload.workflow.id : null,
  );
  const workflowName = buildWorkflowName(payload);
  const stageId = buildStageId(payload);
  const stageName = buildStageName(payload);

  return processDetailSchema.parse({
    id,
    supplierCompanyId,
    supplierName: pickSupplierDisplayName(payload),
    developmentId: pickText(payload.developmentId),
    developmentName: pickText(payload.developmentName),
    buyerId: pickText(payload.buyerId),
    buyerName: pickText(payload.buyerName),
    propertyLabel: pickText(payload.propertyLabel, payload.name, payload.title) ?? name,
    registrationNumber: pickText(payload.registrationNumber),
    status: toProcessStatus(payload.status),
    workflowId,
    workflowName,
    stageId,
    stageName,
    pendingRequirements: pickNumber(0, payload.pendingRequirements),
    waitingOn: pickText(payload.waitingOn) ?? null,
    createdAt: pickText(payload.createdAt) ?? "",
    updatedAt: pickText(payload.updatedAt, payload.createdAt) ?? "",
    dueAt: pickText(payload.dueAt),
    name,
    workflow,
    stages,
    buyer: normalizeProcessDetailBuyer(payload.buyer),
  });
}

export function toProcessListResult(
  response: unknown,
  requestedPage: number,
  requestedLimit: number,
) {
  const items = pickProcessItems(response).map(toProcessListItem);
  const paginationSource = isRecord(response)
    ? isRecord(response.pagination)
      ? response.pagination
      : isRecord(response.meta)
        ? response.meta
        : response
    : null;

  return processListResultSchema.parse({
    items,
    pagination: {
      page: Math.max(1, pickNumber(requestedPage, paginationSource?.page)),
      limit: Math.max(
        1,
        pickNumber(requestedLimit, paginationSource?.limit, paginationSource?.pageSize),
      ),
      totalItems: Math.max(
        0,
        pickNumber(
          items.length,
          paginationSource?.totalItems,
          paginationSource?.total,
          paginationSource?.count,
        ),
      ),
      totalPages: Math.max(
        1,
        pickNumber(
          Math.ceil(
            (pickNumber(
              items.length,
              paginationSource?.totalItems,
              paginationSource?.total,
              paginationSource?.count,
            ) || items.length) /
              Math.max(
                1,
                pickNumber(requestedLimit, paginationSource?.limit, paginationSource?.pageSize),
              ),
          ),
          paginationSource?.totalPages,
        ),
      ),
      hasNextPage: pickBoolean(paginationSource?.hasNextPage) ?? false,
      hasPreviousPage: pickBoolean(paginationSource?.hasPreviousPage) ?? false,
    },
  });
}
