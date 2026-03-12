import {
  type DashboardActivity,
  type DashboardChartPoint,
  type DashboardKpi,
  type DashboardPortalRole,
  type DashboardSavedPaymentMethod,
  dashboardQuerySchema,
  dashboardSnapshotSchema,
  type DashboardSnapshot,
  type DashboardSpotlight,
  type DashboardTeamMember,
  type DashboardTransaction,
  type TransactionCategory,
  type TransactionMethod,
  type TransactionStatus,
} from "./dashboard-schema";

const PERIODS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const BASE_REVENUE = [118_000, 126_000, 138_400, 144_000, 152_300, 160_200, 169_000, 174_500, 181_400, 189_200, 194_000, 201_500];
const BASE_EXPENSES = [73_500, 75_200, 79_800, 83_300, 86_900, 91_500, 94_000, 96_500, 99_100, 102_500, 106_100, 109_400];

const ROLE_MULTIPLIER: Record<DashboardPortalRole, number> = {
  backoffice: 1.25,
  supplier: 0.88,
  customer: 1.06,
};

const CATEGORY_ORDER: TransactionCategory[] = [
  "subscriptions",
  "services",
  "operations",
  "payroll",
  "taxes",
  "marketing",
];

const STATUS_ORDER: TransactionStatus[] = ["paid", "pending", "failed", "refunded"];
const METHOD_ORDER: TransactionMethod[] = ["pix", "bank_transfer", "credit_card", "debit_card", "boleto"];

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  subscriptions: "Assinaturas",
  services: "Serviços profissionais",
  operations: "Operações",
  payroll: "Folha de pagamento",
  taxes: "Impostos",
  marketing: "Marketing",
};

const METHOD_LABELS: Record<TransactionMethod, string> = {
  pix: "PIX",
  bank_transfer: "Transferência bancária",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  boleto: "Boleto",
};

const STATUS_LABELS: Record<TransactionStatus, string> = {
  paid: "Pago",
  pending: "Pendente",
  failed: "Falhou",
  refunded: "Estornado",
};

const PORTAL_TEAM: Record<
  DashboardPortalRole,
  Array<Pick<DashboardTeamMember, "name" | "email" | "role" | "statusLabel" | "statusTone">>
> = {
  backoffice: [
    {
      name: "Camila Ribeiro",
      email: "camila.ribeiro@registra.ai",
      role: "Coordenação operacional",
      statusLabel: "Online",
      statusTone: "success",
    },
    {
      name: "Mateus Leal",
      email: "mateus.leal@registra.ai",
      role: "Gestão de SLA",
      statusLabel: "Em reunião",
      statusTone: "warning",
    },
    {
      name: "Julia Martins",
      email: "julia.martins@registra.ai",
      role: "Qualidade",
      statusLabel: "Disponivel",
      statusTone: "neutral",
    },
  ],
  supplier: [
    {
      name: "Larissa Faria",
      email: "larissa.faria@fornecedor.com",
      role: "Gestão documental",
      statusLabel: "Online",
      statusTone: "success",
    },
    {
      name: "Eduardo Melo",
      email: "eduardo.melo@fornecedor.com",
      role: "Compliance",
      statusLabel: "Validando",
      statusTone: "warning",
    },
    {
      name: "Bianca Costa",
      email: "bianca.costa@fornecedor.com",
      role: "Atendimento",
      statusLabel: "Disponivel",
      statusTone: "neutral",
    },
  ],
  customer: [
    {
      name: "Patricia Nunes",
      email: "patricia.nunes@cliente.com",
      role: "Sucesso do cliente",
      statusLabel: "Online",
      statusTone: "success",
    },
    {
      name: "Rafael Gomes",
      email: "rafael.gomes@cliente.com",
      role: "Documentação",
      statusLabel: "Respondendo solicitação",
      statusTone: "warning",
    },
    {
      name: "Aline Diniz",
      email: "aline.diniz@cliente.com",
      role: "Financeiro",
      statusLabel: "Disponivel",
      statusTone: "neutral",
    },
  ],
};

const PORTAL_ACTIVITIES: Record<
  DashboardPortalRole,
  Array<Pick<DashboardActivity, "title" | "description" | "tone">>
> = {
  backoffice: [
    {
      title: "Fila crítica redistribuída",
      description: "7 processos mudaram para o squad de contingência.",
      tone: "warning",
    },
    {
      title: "Lote de matrículas concluído",
      description: "12 registros avançaram para emissão final.",
      tone: "success",
    },
    {
      title: "Novo ticket de cartório",
      description: "Pendência jurídica aberta para análise.",
      tone: "info",
    },
  ],
  supplier: [
    {
      title: "Checklist documental revisado",
      description: "Quatro empreendimentos receberam nova solicitação.",
      tone: "warning",
    },
    {
      title: "Pendencia resolvida",
      description: "Contrato complementar anexado e aprovado.",
      tone: "success",
    },
    {
      title: "Resposta do backoffice",
      description: "Equipe operacional comentou o processo Torre Norte.",
      tone: "info",
    },
  ],
  customer: [
    {
      title: "Nova etapa liberada",
      description: "Seu processo avançou para registro em cartório.",
      tone: "success",
    },
    {
      title: "Documento complementar solicitado",
      description: "Atualize o comprovante de endereço para seguir.",
      tone: "warning",
    },
    {
      title: "Mensagem da equipe",
      description: "Analista confirmou recebimento dos anexos.",
      tone: "info",
    },
  ],
};

const PORTAL_SPOTLIGHTS: Record<
  DashboardPortalRole,
  Array<Pick<DashboardSpotlight, "title" | "description" | "stage" | "slaLabel" | "priorityTone">>
> = {
  backoffice: [
    {
      title: "Residencial Aurora - bloco B",
      description: "Pendência no retorno do cartório e prazo acima do esperado.",
      stage: "Análise documental",
      slaLabel: "9 dias em atraso",
      priorityTone: "danger",
    },
    {
      title: "Loteamento Vista Sul",
      description: "Aguardando validação da certidão negativa consolidada.",
      stage: "Conferência final",
      slaLabel: "Acomp. diário",
      priorityTone: "warning",
    },
  ],
  supplier: [
    {
      title: "Condomínio Horizonte",
      description: "Falta assinatura da procuração em 2 unidades.",
      stage: "Coleta de assinaturas",
      slaLabel: "Prazo vence hoje",
      priorityTone: "warning",
    },
    {
      title: "Parque das Aguas",
      description: "Backoffice sinalizou divergência de memorial.",
      stage: "Validação técnica",
      slaLabel: "Alta prioridade",
      priorityTone: "danger",
    },
  ],
  customer: [
    {
      title: "Apartamento 1204",
      description: "Processo pronto para revisão final de dados pessoais.",
      stage: "Conferência cadastral",
      slaLabel: "Responder em 24h",
      priorityTone: "warning",
    },
    {
      title: "Unidade Garden 03",
      description: "Matrícula em emissão e previsão de conclusão na semana.",
      stage: "Emissão da matrícula",
      slaLabel: "Dentro do SLA",
      priorityTone: "neutral",
    },
  ],
};

const PORTAL_PAYMENT_METHODS: Record<DashboardPortalRole, DashboardSavedPaymentMethod[]> = {
  backoffice: [
    { id: "backoffice-visa", brand: "visa", label: "Visa corporativo", detail: "**** 4242", isDefault: true },
    {
      id: "backoffice-pix",
      brand: "pix",
      label: "PIX operacional",
      detail: "financeiro@registra.ai",
      isDefault: false,
    },
  ],
  supplier: [
    { id: "supplier-master", brand: "mastercard", label: "Mastercard", detail: "**** 5521", isDefault: true },
    {
      id: "supplier-pix",
      brand: "pix",
      label: "PIX fornecedor",
      detail: "tesouraria@fornecedor.com",
      isDefault: false,
    },
  ],
  customer: [
    { id: "customer-visa", brand: "visa", label: "Visa pessoal", detail: "**** 1889", isDefault: true },
    {
      id: "customer-pix",
      brand: "pix",
      label: "PIX pessoal",
      detail: "cpf@cliente.com",
      isDefault: false,
    },
  ],
};

function toMoney(value: number): number {
  return Number(value.toFixed(2));
}

function percentageDelta(currentValue: number, previousValue: number): number {
  if (previousValue === 0) {
    return 0;
  }
  return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(1));
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function buildChart(role: DashboardPortalRole): DashboardChartPoint[] {
  const multiplier = ROLE_MULTIPLIER[role];
  return PERIODS.map((period, index) => ({
    period,
    revenue: toMoney(BASE_REVENUE[index] * multiplier),
    expenses: toMoney(BASE_EXPENSES[index] * multiplier * (role === "backoffice" ? 1.02 : 0.98)),
  }));
}

function buildTransactions(role: DashboardPortalRole): DashboardTransaction[] {
  const multiplier = ROLE_MULTIPLIER[role];
  const transactions: DashboardTransaction[] = [];

  for (let index = 0; index < 42; index += 1) {
    const category = CATEGORY_ORDER[index % CATEGORY_ORDER.length];
    const status = STATUS_ORDER[(index + 1) % STATUS_ORDER.length];
    const method = METHOD_ORDER[index % METHOD_ORDER.length];
    const day = (index % 27) + 1;
    const baseAmount = 2_800 + (index % 11) * 760;
    const direction = category === "subscriptions" || category === "services" ? 1 : -1;

    transactions.push({
      id: `${role}-${index + 1}`,
      date: new Date(Date.UTC(2025, 11 + Math.floor(index / 20), day, 10, 20, 0)).toISOString(),
      description: `${CATEGORY_LABELS[category]} #${index + 1}`,
      category,
      method,
      status,
      value: toMoney(direction * baseAmount * multiplier),
    });
  }

  return transactions;
}

function buildKpis(role: DashboardPortalRole, chart: DashboardChartPoint[]): DashboardKpi[] {
  const previous = chart.slice(0, 6);
  const current = chart.slice(6, 12);

  const previousRevenue = previous.reduce((total, item) => total + item.revenue, 0);
  const currentRevenue = current.reduce((total, item) => total + item.revenue, 0);
  const previousExpenses = previous.reduce((total, item) => total + item.expenses, 0);
  const currentExpenses = current.reduce((total, item) => total + item.expenses, 0);
  const previousProfit = previousRevenue - previousExpenses;
  const currentProfit = currentRevenue - currentExpenses;

  const currentArr = (currentRevenue / current.length) * 12;
  const previousArr = (previousRevenue / previous.length) * 12;
  const runRateLabel = role === "customer" ? "MRR" : "ARR";
  const runRateValue = role === "customer" ? currentArr / 12 : currentArr;
  const previousRunRate = role === "customer" ? previousArr / 12 : previousArr;

  return [
    {
      key: "revenue",
      label: "Receita",
      value: toMoney(currentRevenue),
      deltaPercentage: percentageDelta(currentRevenue, previousRevenue),
    },
    {
      key: "expenses",
      label: "Despesas",
      value: toMoney(currentExpenses),
      deltaPercentage: percentageDelta(currentExpenses, previousExpenses),
    },
    {
      key: "profit",
      label: "Lucro",
      value: toMoney(currentProfit),
      deltaPercentage: percentageDelta(currentProfit, previousProfit),
    },
    {
      key: "runRate",
      label: runRateLabel,
      value: toMoney(runRateValue),
      deltaPercentage: percentageDelta(runRateValue, previousRunRate),
    },
  ];
}

function buildTeamMembers(role: DashboardPortalRole): DashboardTeamMember[] {
  return PORTAL_TEAM[role].map((member, index) => ({
    id: `${role}-member-${index + 1}`,
    ...member,
  }));
}

function buildActivities(role: DashboardPortalRole): DashboardActivity[] {
  const baseDate = Date.UTC(2026, 2, 10, 14, 0, 0);

  return PORTAL_ACTIVITIES[role].map((activity, index) => ({
    id: `${role}-activity-${index + 1}`,
    ...activity,
    timestamp: new Date(baseDate - index * 1000 * 60 * 42).toISOString(),
  }));
}

function buildSpotlights(role: DashboardPortalRole): DashboardSpotlight[] {
  return PORTAL_SPOTLIGHTS[role].map((spotlight, index) => ({
    id: `${role}-spotlight-${index + 1}`,
    ...spotlight,
  }));
}

export function getDashboardMeta() {
  return {
    categories: CATEGORY_ORDER.map((key) => ({ key, label: CATEGORY_LABELS[key] })),
    statuses: STATUS_ORDER.map((key) => ({ key, label: STATUS_LABELS[key] })),
    methods: METHOD_ORDER.map((key) => ({ key, label: METHOD_LABELS[key] })),
  };
}

export async function fetchDashboardSnapshot(input: unknown): Promise<DashboardSnapshot> {
  const parsedInput = dashboardQuerySchema.parse(input);
  const { portalRole, simulateDelayMs, failRate, forceError } = parsedInput;

  await sleep(simulateDelayMs);

  if (forceError || Math.random() < failRate) {
    throw new Error("Falha temporária ao carregar o dashboard. Tente novamente.");
  }

  const chart = buildChart(portalRole);
  const transactions = buildTransactions(portalRole);
  const kpis = buildKpis(portalRole, chart);
  const teamMembers = buildTeamMembers(portalRole);
  const activities = buildActivities(portalRole);
  const spotlights = buildSpotlights(portalRole);
  const paymentMethods = PORTAL_PAYMENT_METHODS[portalRole];

  return dashboardSnapshotSchema.parse({
    kpis,
    chart,
    transactions,
    teamMembers,
    activities,
    spotlights,
    paymentMethods,
    generatedAt: new Date().toISOString(),
  });
}
