import type {
  SupplierDetail,
  SupplierInternalUser,
  SupplierListItem,
  SupplierProcessesListResult,
  SuppliersListResult,
  SupplierStatus,
} from "../../../packages/shared/src/supplier/supplier-schema";

interface SandboxSupplierRecord {
  id: string;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  legalRepresentativeName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  workflowId: string;
  workflowName: string;
  notes: string;
  address: {
    zipCode: string;
    street: string;
    number: string;
    complement: string;
    district: string;
    city: string;
    state: string;
  };
  onboarding: {
    portal: string;
    signupCompleted: boolean;
    signupCompletedAt: string;
    emailVerified: boolean;
    emailVerifiedAt: string;
    passwordDefined: boolean;
  };
  internalUsers: SupplierInternalUser[];
}

function buildInternalUsers(): SupplierInternalUser[] {
  return [
    {
      id: "supusr_001",
      name: "Marina Duarte Soares",
      email: "marina.duarte@atlasresidencial.com.br",
      phone: "11991234567",
      role: "Administradora",
      status: "active",
      createdAt: "2026-02-18T14:22:31.000Z",
    },
    {
      id: "supusr_002",
      name: "Carlos Henrique Prado",
      email: "carlos.prado@atlasresidencial.com.br",
      phone: "11988776655",
      role: "Operador",
      status: "active",
      createdAt: "2026-02-20T09:10:12.000Z",
    },
    {
      id: "supusr_003",
      name: "Aline Martins Costa",
      email: "aline.costa@atlasresidencial.com.br",
      phone: "11987654321",
      role: "Financeiro",
      status: "active",
      createdAt: "2026-02-21T11:45:00.000Z",
    },
    {
      id: "supusr_004",
      name: "Rafael Nogueira Lima",
      email: "rafael.lima@atlasresidencial.com.br",
      phone: "11983456789",
      role: "Juridico",
      status: "active",
      createdAt: "2026-02-22T08:05:43.000Z",
    },
    {
      id: "supusr_005",
      name: "Bianca Ferreira Alves",
      email: "bianca.alves@atlasresidencial.com.br",
      phone: "11982345678",
      role: "Coordenadora",
      status: "active",
      createdAt: "2026-02-23T13:18:20.000Z",
    },
    {
      id: "supusr_006",
      name: "Thiago Pires Mendes",
      email: "thiago.mendes@atlasresidencial.com.br",
      phone: "11984561234",
      role: "Operador",
      status: "active",
      createdAt: "2026-02-24T09:40:15.000Z",
    },
    {
      id: "supusr_007",
      name: "Juliana Ramos Teixeira",
      email: "juliana.teixeira@atlasresidencial.com.br",
      phone: "11985672345",
      role: "Atendimento",
      status: "active",
      createdAt: "2026-02-24T15:02:09.000Z",
    },
    {
      id: "supusr_008",
      name: "Eduardo Cavalcanti Rocha",
      email: "eduardo.rocha@atlasresidencial.com.br",
      phone: "11986783456",
      role: "Compliance",
      status: "active",
      createdAt: "2026-02-25T10:55:42.000Z",
    },
    {
      id: "supusr_009",
      name: "Fernanda Gomes Barros",
      email: "fernanda.barros@atlasresidencial.com.br",
      phone: "11987894567",
      role: "Operadora Senior",
      status: "active",
      createdAt: "2026-02-26T14:27:31.000Z",
    },
    {
      id: "supusr_010",
      name: "Lucas Araujo Farias",
      email: "lucas.farias@atlasresidencial.com.br",
      phone: "11988905678",
      role: "Supervisor",
      status: "active",
      createdAt: "2026-02-27T16:12:58.000Z",
    },
  ];
}

export const activeSupplierCompanyMock: SandboxSupplierRecord = {
  id: "supco_9b7c1d45-2f61-4d4f-8f26-1ef85f1137a1",
  status: "active",
  createdAt: "2026-02-18T14:22:31.000Z",
  updatedAt: "2026-03-07T10:14:09.000Z",
  legalName: "Atlas Incorporadora SPE Ltda",
  tradeName: "Atlas Residencial",
  cnpj: "12.345.678/0001-90",
  legalRepresentativeName: "Marina Duarte Soares",
  contactName: "Marina Duarte Soares",
  contactEmail: "marina.duarte@atlasresidencial.com.br",
  contactPhone: "11991234567",
  workflowId: "workflow_registro_padrao_sp",
  workflowName: "Workflow Registro Padrao SP",
  notes: "Cadastro validado via onboarding do supplier e liberado para operacao no backoffice.",
  address: {
    zipCode: "04538132",
    street: "Avenida Engenheiro Luis Carlos Berrini",
    number: "105",
    complement: "14 andar",
    district: "Cidade Moncoes",
    city: "Sao Paulo",
    state: "SP",
  },
  onboarding: {
    portal: "supplier",
    signupCompleted: true,
    signupCompletedAt: "2026-02-18T14:22:31.000Z",
    emailVerified: true,
    emailVerifiedAt: "2026-02-18T14:25:04.000Z",
    passwordDefined: true,
  },
  internalUsers: buildInternalUsers(),
};

function toSupplierListItem(record: SandboxSupplierRecord): SupplierListItem {
  return {
    id: record.id,
    legalName: record.legalName,
    cnpj: record.cnpj,
    email: record.contactEmail,
    workflowId: record.workflowId,
    workflowName: record.workflowName,
    status: record.status,
    createdAt: record.createdAt,
  };
}

function toSupplierDetail(record: SandboxSupplierRecord): SupplierDetail {
  return {
    ...toSupplierListItem(record),
    tradeName: record.tradeName,
    legalRepresentativeName: record.legalRepresentativeName,
    contactName: record.contactName,
    phone: record.contactPhone,
    zipCode: record.address.zipCode,
    street: record.address.street,
    number: record.address.number,
    complement: record.address.complement,
    district: record.address.district,
    notes: record.notes,
    city: record.address.city,
    state: record.address.state,
    updatedAt: record.updatedAt,
    internalUsers: record.internalUsers,
  };
}

function includesFilter(source: string, filter?: string): boolean {
  if (!filter) {
    return true;
  }

  return source.toLowerCase().includes(filter.trim().toLowerCase());
}

export function getSandboxSupplierList(params: {
  page: number;
  limit: number;
  name?: string;
  cnpj?: string;
  status?: SupplierStatus;
}): SuppliersListResult {
  const matches = [activeSupplierCompanyMock].filter((record) => {
    if (params.status && record.status !== params.status) {
      return false;
    }

    if (!includesFilter(record.legalName, params.name) && !includesFilter(record.tradeName, params.name)) {
      return false;
    }

    const normalizedFilter = params.cnpj?.replace(/\D/g, "");
    const normalizedCnpj = record.cnpj.replace(/\D/g, "");
    if (normalizedFilter && !normalizedCnpj.includes(normalizedFilter)) {
      return false;
    }

    return true;
  });

  const totalItems = matches.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / params.limit) || 1);
  const page = Math.min(Math.max(1, params.page), totalPages);
  const startIndex = (page - 1) * params.limit;

  return {
    items: matches.slice(startIndex, startIndex + params.limit).map(toSupplierListItem),
    pagination: {
      page,
      limit: params.limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export function getSandboxSupplierDetail(supplierId: string): SupplierDetail | null {
  if (supplierId !== activeSupplierCompanyMock.id) {
    return null;
  }

  return toSupplierDetail(activeSupplierCompanyMock);
}

export function getSandboxSupplierProcesses(
  supplierId: string,
  page: number,
  limit: number,
): SupplierProcessesListResult | null {
  if (supplierId !== activeSupplierCompanyMock.id) {
    return null;
  }

  const items = [
    {
      id: "proc-atlas-onboarding-1",
      protocol: "REG-ATL-0001",
      title: "Registro da unidade 1104 - Torre A",
      developmentName: "Atlas Residencial Fase 1",
      workflowName: "Registro imobiliario",
      currentStepName: "Validacao documental",
      status: "in_progress" as const,
      createdAt: "2026-02-24T13:00:00.000Z",
      updatedAt: "2026-03-10T18:20:00.000Z",
    },
    {
      id: "proc-atlas-onboarding-2",
      protocol: "REG-ATL-0002",
      title: "Registro da unidade 1208 - Torre B",
      developmentName: "Atlas Residencial Fase 1",
      workflowName: "Registro imobiliario",
      currentStepName: "Aguardando documentos do comprador",
      status: "in_progress" as const,
      createdAt: "2026-02-27T09:30:00.000Z",
      updatedAt: "2026-03-11T15:05:00.000Z",
    },
    {
      id: "proc-atlas-onboarding-3",
      protocol: "REG-ATL-0003",
      title: "Registro da unidade 605 - Torre C",
      developmentName: "Atlas Residencial Fase 1",
      workflowName: "Registro imobiliario",
      currentStepName: "Exigencia cartorial",
      status: "in_progress" as const,
      createdAt: "2026-03-01T11:15:00.000Z",
      updatedAt: "2026-03-12T09:40:00.000Z",
    },
  ];
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * limit;

  return {
    items: items.slice(startIndex, startIndex + limit),
    pagination: {
      page: currentPage,
      limit,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
  };
}
