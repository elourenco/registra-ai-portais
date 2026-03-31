import {
  buyerProcessSnapshotSchema,
  type BuyerProcessDocument,
  type BuyerProcessMaritalStatus,
  type BuyerProcessSnapshot,
  type BuyerProcessTrackerStatus,
  type BuyerProcessTimelineStage,
} from "@registra/shared";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

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

function pickNumber(...values: unknown[]): number | null {
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

  return null;
}

function pickRecord(source: unknown, keys: string[]): Record<string, unknown> | null {
  if (!isRecord(source)) {
    return null;
  }

  for (const key of keys) {
    const value = source[key];
    if (isRecord(value)) {
      return value;
    }
  }

  return null;
}

function pickArray(source: unknown, keys: string[]): unknown[] {
  if (!isRecord(source)) {
    return [];
  }

  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function unwrapPayload(payload: unknown): Record<string, unknown> | null {
  if (Array.isArray(payload)) {
    return payload.find(isRecord) ?? null;
  }

  if (!isRecord(payload)) {
    return null;
  }

  const nested = pickRecord(payload, ["data", "process", "buyerProcess", "item"]);
  return nested ?? payload;
}

function normalizeIdentifierType(value: unknown): "cpf" | "cnpj" {
  const normalized = pickText(value)?.toLowerCase();
  return normalized === "cnpj" ? "cnpj" : "cpf";
}

function normalizeMaritalStatus(value: unknown, hasSpouse: boolean): BuyerProcessMaritalStatus {
  const normalized = pickText(value)?.toLowerCase();

  switch (normalized) {
    case "married":
    case "casado":
      return "married";
    case "stable_union":
    case "stable-union":
    case "stable union":
    case "uniao_estavel":
    case "união estável":
      return "stable_union";
    case "single":
    case "solteiro":
      return "single";
    default:
      return hasSpouse ? "married" : "single";
  }
}

function normalizeTrackerStatus(value: unknown, documents: BuyerProcessDocument[]): BuyerProcessTrackerStatus {
  const normalized = pickText(value)?.toLowerCase();

  switch (normalized) {
    case "completed":
    case "done":
      return "completed";
    case "approved":
    case "submitted":
    case "under_review":
    case "under-review":
    case "in_review":
    case "in-review":
      return "in_review";
    case "rejected":
    case "rework_requested":
    case "rework-requested":
    case "awaiting_submission":
    case "awaiting-submission":
      return "waiting_user";
    default:
      if (documents.some((document) => document.status === "rejected" || document.status === "pending")) {
        return "waiting_user";
      }

      if (documents.length > 0 && documents.every((document) => document.status === "approved")) {
        return "in_review";
      }

      return "in_progress";
  }
}

function buildTimeline(status: BuyerProcessTrackerStatus, currentStageName?: string | null): BuyerProcessTimelineStage[] {
  if (status === "completed") {
    return [
      { id: "certificate", title: "Certificado", status: "completed", description: "Documentos iniciais validados." },
      { id: "contract", title: "Contrato", status: "completed", description: "Contrato assinado e confirmado." },
      { id: "registry", title: "Registro", status: "completed", description: "Registro final concluído." },
    ];
  }

  if (status === "waiting_user") {
    return [
      {
        id: "certificate",
        title: "Certificado",
        status: "in_progress",
        description: currentStageName ?? "Há itens aguardando seu envio ou correção.",
      },
      {
        id: "contract",
        title: "Contrato",
        status: "pending",
        description: "Será iniciado após a validação documental.",
      },
      {
        id: "registry",
        title: "Registro",
        status: "pending",
        description: "Última etapa do processo.",
      },
    ];
  }

  if (status === "in_review") {
    return [
      {
        id: "certificate",
        title: "Certificado",
        status: "completed",
        description: "Dados e documentos iniciais conferidos.",
      },
      {
        id: "contract",
        title: "Contrato",
        status: "in_progress",
        description: currentStageName ?? "Equipe conferindo contrato e anexos.",
      },
      {
        id: "registry",
        title: "Registro",
        status: "pending",
        description: "Será iniciado após a etapa contratual.",
      },
    ];
  }

  return [
    {
      id: "certificate",
      title: "Certificado",
      status: "in_progress",
      description: currentStageName ?? "Cadastro em andamento.",
    },
    {
      id: "contract",
      title: "Contrato",
      status: "pending",
      description: "Será iniciado após o envio das informações obrigatórias.",
    },
    {
      id: "registry",
      title: "Registro",
      status: "pending",
      description: "Última etapa do processo.",
    },
  ];
}

function inferDocumentOwner(source: Record<string, unknown>): BuyerProcessDocument["owner"] {
  const owner = pickText(source.owner, source.responsible, source.uploadedBy)?.toLowerCase();

  if (owner === "spouse" || owner === "conjuge" || owner === "cônjuge") {
    return "spouse";
  }

  if (owner === "backoffice") {
    return "backoffice";
  }

  return "buyer";
}

function normalizeDocumentStatus(value: unknown): BuyerProcessDocument["status"] {
  const normalized = pickText(value)?.toLowerCase();

  switch (normalized) {
    case "approved":
    case "valid":
      return "approved";
    case "rejected":
    case "invalid":
    case "rework_requested":
    case "rework-requested":
      return "rejected";
    case "uploaded":
    case "submitted":
    case "under_review":
    case "under-review":
    case "in_review":
    case "in-review":
      return "uploaded";
    default:
      return "pending";
  }
}

function normalizeDocuments(
  process: Record<string, unknown>,
  spouseData: BuyerProcessSnapshot["spouseData"],
): BuyerProcessDocument[] {
  const documents = pickArray(process, [
    "documents",
    "requiredDocuments",
    "documentChecklist",
    "pendingDocuments",
    "items",
  ]);

  return documents
    .filter(isRecord)
    .map((document, index) => {
      const title =
        pickText(document.title, document.name, document.label, document.documentName) ??
        `Documento ${index + 1}`;

      return {
        id: pickText(document.id, document.documentId, document.type, title) ?? `document-${index + 1}`,
        title,
        owner: spouseData && title.toLowerCase().includes("cônjuge")
          ? "spouse"
          : inferDocumentOwner(document),
        status: normalizeDocumentStatus(document.status),
        fileName: pickText(document.fileName, document.originalName, document.filename),
        fileType: pickText(document.fileType, document.mimeType, document.extension),
        fileSizeKb: pickNumber(document.fileSizeKb, document.sizeKb, document.size),
        previewUrl: pickText(document.previewUrl, document.fileUrl, document.url),
        rejectionReason: pickText(document.rejectionReason, document.reason, document.comment),
      };
    });
}

export function normalizeBuyerProcessResponse(payload: unknown): BuyerProcessSnapshot | null {
  const root = unwrapPayload(payload);
  if (!root) {
    return null;
  }

  const process = pickRecord(root, ["process", "buyerProcess", "instance", "processInstance"]) ?? root;
  const buyer = pickRecord(process, ["buyer", "customer", "participant"]) ?? pickRecord(root, ["buyer", "customer"]);
  const spouse = pickRecord(process, ["spouse", "partner"]) ?? pickRecord(root, ["spouse", "partner"]);
  const development =
    pickRecord(process, ["development", "project", "property", "unit"]) ??
    pickRecord(root, ["development", "project", "property", "unit"]);

  const identifierType = normalizeIdentifierType(
    buyer?.identifierType ?? buyer?.documentType ?? root.identifierType,
  );

  const spouseData = spouse
    ? {
        id: pickText(spouse.id, spouse.spouseId) ?? "spouse",
        fullName: pickText(spouse.name, spouse.fullName) ?? "",
        documentNumber: pickText(spouse.cpf, spouse.documentNumber, spouse.document) ?? "",
        birthDate: pickText(spouse.birthDate, spouse.dateOfBirth),
        nationality: null,
        profession: null,
        email: pickText(spouse.email),
        phone: pickText(spouse.phone, spouse.mobile),
      }
    : null;

  const documents = normalizeDocuments(process, spouseData);
  const hasSpouse = Boolean(
    spouseData?.fullName ||
      spouseData?.documentNumber ||
      pickText(process.spouseName, process.spouseCpf),
  );
  const maritalStatus = normalizeMaritalStatus(
    buyer?.maritalStatus ?? process.maritalStatus ?? root.maritalStatus,
    hasSpouse,
  );
  const currentStageName = pickText(
    process.currentStageName,
    process.currentStepName,
    process.currentBlockName,
    process.stageName,
  );
  const trackerStatus = normalizeTrackerStatus(process.status ?? root.status, documents);

  return buyerProcessSnapshotSchema.parse({
    processId: pickText(process.id, process.processId, root.id) ?? "buyer-process",
    identifierType,
    property: {
      empreendimento:
        pickText(
          development?.name,
          development?.developmentName,
          process.developmentName,
          root.developmentName,
        ) ?? "Empreendimento não informado",
      unidade:
        pickText(
          development?.unitLabel,
          development?.name,
          process.unitLabel,
          process.unit,
          root.unitLabel,
        ) ?? "Unidade não informada",
      cidade:
        pickText(
          development?.city,
          development?.location,
          process.city,
          root.city,
        ) ?? "Cidade não informada",
    },
    personalData: {
      id: pickText(buyer?.id, buyer?.buyerId, root.buyerId) ?? "buyer",
      fullName: pickText(buyer?.name, buyer?.fullName, root.buyerName) ?? "Comprador",
      documentNumber:
        pickText(buyer?.cpf, buyer?.cnpj, buyer?.documentNumber, buyer?.document) ?? "",
      birthDate: pickText(buyer?.birthDate, buyer?.dateOfBirth),
      nationality: pickText(buyer?.nationality),
      profession: pickText(buyer?.profession, buyer?.occupation),
      email: pickText(buyer?.email),
      phone: pickText(buyer?.phone, buyer?.mobile),
    },
    maritalStatus,
    spouseData,
    hasSpouse,
    documents,
    trackerStatus,
    timeline: buildTimeline(trackerStatus, currentStageName),
    submittedAt: pickText(process.submittedAt, process.updatedAt, root.updatedAt),
  });
}
