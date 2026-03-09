import {
  type DashboardChartPoint,
  type DashboardKpi,
  type DashboardPortalRole,
  dashboardQuerySchema,
  dashboardSnapshotSchema,
  type DashboardSnapshot,
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
  subscriptions: "Subscriptions",
  services: "Professional Services",
  operations: "Operations",
  payroll: "Payroll",
  taxes: "Taxes",
  marketing: "Marketing",
};

const METHOD_LABELS: Record<TransactionMethod, string> = {
  pix: "PIX",
  bank_transfer: "Bank Transfer",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  boleto: "Boleto",
};

const STATUS_LABELS: Record<TransactionStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
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
    throw new Error("Falha temporaria ao carregar dashboard. Tente novamente.");
  }

  const chart = buildChart(portalRole);
  const transactions = buildTransactions(portalRole);
  const kpis = buildKpis(portalRole, chart);

  return dashboardSnapshotSchema.parse({
    kpis,
    chart,
    transactions,
    generatedAt: new Date().toISOString(),
  });
}
