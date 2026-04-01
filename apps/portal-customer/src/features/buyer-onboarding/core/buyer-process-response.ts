import {
  type BuyerProcessDocument,
  type BuyerProcessMaritalStatus,
  type BuyerProcessSnapshot,
  type BuyerProcessTimelineStage,
  type BuyerProcessTrackerStatus,
  buyerProcessSnapshotSchema,
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

function pickBoolean(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") {
        return true;
      }
      if (normalized === "false") {
        return false;
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

function pickFirstRecord(source: unknown, keys: string[]): Record<string, unknown> | null {
  const items = pickArray(source, keys);
  return items.find(isRecord) ?? null;
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

function normalizeTrackerStatus(
  value: unknown,
  documents: BuyerProcessDocument[],
): BuyerProcessTrackerStatus {
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
      if (
        documents.some(
          (document) => document.status === "rejected" || document.status === "pending",
        )
      ) {
        return "waiting_user";
      }

      if (documents.length > 0 && documents.every((document) => document.status === "approved")) {
        return "in_review";
      }

      return "in_progress";
  }
}

function buildTimeline(
  status: BuyerProcessTrackerStatus,
  currentStageName?: string | null,
): BuyerProcessTimelineStage[] {
  if (status === "completed") {
    return [
      {
        id: "certificate",
        title: "Certificado",
        status: "completed",
        description: "Documentos iniciais validados.",
      },
      {
        id: "contract",
        title: "Contrato",
        status: "completed",
        description: "Contrato assinado e confirmado.",
      },
      {
        id: "registry",
        title: "Registro",
        status: "completed",
        description: "Registro final concluído.",
      },
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

function buildDevelopmentAddress(development: Record<string, unknown> | null): string | null {
  const address = pickRecord(development, ["address", "location"]);
  if (!address) {
    return pickText(
      development?.fullAddress,
      development?.addressLabel,
      development?.formattedAddress,
      development?.location,
    );
  }

  const streetLine = [pickText(address.address), pickText(address.number)]
    .filter((value): value is string => Boolean(value))
    .join(", ");
  const district = pickText(address.neighborhood);
  const cityState = [pickText(address.city), pickText(address.state)]
    .filter((value): value is string => Boolean(value))
    .join(" - ");
  const postalCode = pickText(address.postalCode, address.zipCode);

  return [streetLine, district, cityState, postalCode]
    .filter((value): value is string => Boolean(value))
    .join(" • ");
}

function normalizeAcquisitionTypeLabel(value: unknown): string | null {
  const normalized = pickText(value)?.toLowerCase();

  switch (normalized) {
    case "cash":
      return "Pagamento à vista";
    case "financed":
    case "financing":
    case "financiamento":
      return "Financiamento";
    case "consortium":
    case "consorcio":
    case "consórcio":
      return "Consórcio";
    case "fgts":
      return "FGTS";
    case "mixed":
    case "misto":
      return "Composição mista";
    default:
      return pickText(value);
  }
}

function formatCurrencyValue(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function normalizePurchaseValueLabel(...values: unknown[]): string | null {
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

  return documents.filter(isRecord).map((document, index) => {
    const title =
      pickText(document.title, document.name, document.label, document.documentName) ??
      `Documento ${index + 1}`;

    return {
      id:
        pickText(document.id, document.documentId, document.type, title) ?? `document-${index + 1}`,
      title,
      owner:
        spouseData && title.toLowerCase().includes("cônjuge")
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

  const process =
    pickRecord(root, ["process", "buyerProcess", "instance", "processInstance"]) ??
    pickFirstRecord(root, ["processes"]) ??
    root;
  const buyer =
    pickRecord(process, ["buyer", "customer", "participant"]) ??
    pickRecord(root, ["buyer", "customer"]);
  const spouse =
    pickRecord(process, ["spouse", "partner"]) ?? pickRecord(root, ["spouse", "partner"]);
  const development =
    pickRecord(process, ["development", "project", "property", "unit"]) ??
    pickRecord(root, ["development", "project", "property", "unit"]);

  const identifierType = normalizeIdentifierType(
    buyer?.identifierType ?? buyer?.documentType ?? root.identifierType,
  );

  const spouseData =
    spouse ||
    pickText(
      buyer?.spouseName,
      buyer?.spouseCpf,
      buyer?.spouseBirthDate,
      buyer?.spouseEmail,
      buyer?.spousePhone,
    )
      ? {
          id: pickText(spouse?.id, spouse?.spouseId) ?? "spouse",
          fullName: pickText(spouse?.name, spouse?.fullName, buyer?.spouseName) ?? "",
          documentNumber:
            pickText(spouse?.cpf, spouse?.documentNumber, spouse?.document, buyer?.spouseCpf) ?? "",
          birthDate: pickText(spouse?.birthDate, spouse?.dateOfBirth, buyer?.spouseBirthDate),
          nationality: null,
          profession: null,
          email: pickText(spouse?.email, buyer?.spouseEmail),
          phone: pickText(spouse?.phone, spouse?.mobile, buyer?.spousePhone),
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
    buyerId: pickText(buyer?.id, buyer?.buyerId, root.buyerId) ?? "buyer",
    processId:
      pickText(buyer?.processId, process.id, process.processId, root.processId, root.id) ??
      "buyer-process",
    identifierType,
    basicDataConfirmed: pickBoolean(buyer?.basicDataConfirmed, root.basicDataConfirmed) ?? false,
    hasEnotariadoCertificate:
      pickBoolean(buyer?.hasEnotariadoCertificate, root.hasEnotariadoCertificate) ?? false,
    property: {
      name:
        pickText(
          development?.name,
          development?.developmentName,
          process.developmentName,
          root.developmentName,
        ) ?? "Empreendimento não informado",
      cnpj:
        pickText(
          development?.cnpj,
          development?.speCnpj,
          development?.documentNumber,
          process.developmentCnpj,
          root.developmentCnpj,
        ) ?? "CNPJ não informado",
      address:
        buildDevelopmentAddress(development) ??
        pickText(
          process.developmentAddress,
          root.developmentAddress,
          process.address,
          root.address,
        ) ??
        "Endereço não informado",
      unitLabel:
        pickText(buyer?.unitLabel, process.unitLabel, process.unit, root.unitLabel, root.unit) ??
        "Unidade não informada",
      acquisitionType:
        normalizeAcquisitionTypeLabel(
          buyer?.acquisitionType ?? process.acquisitionType ?? root.acquisitionType,
        ) ?? "Forma de aquisição não informada",
      purchaseValue:
        normalizePurchaseValueLabel(
          buyer?.purchaseValue,
          buyer?.purchase_price,
          buyer?.amount,
          process.purchaseValue,
          process.purchase_price,
          process.amount,
          root.purchaseValue,
          root.purchase_price,
          root.amount,
        ) ?? "Valor da compra não informado",
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
    submittedAt: pickText(process.submittedAt, root.submittedAt),
  });
}
