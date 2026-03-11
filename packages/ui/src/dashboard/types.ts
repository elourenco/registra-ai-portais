import type {
  DashboardActivity,
  DashboardChartPoint,
  DashboardKpi,
  DashboardPortalRole,
  DashboardSavedPaymentMethod,
  DashboardSpotlight,
  DashboardTeamMember,
  DashboardTransaction,
} from "@registra/shared";
import type { LucideIcon } from "lucide-react";

export type PortalUser = {
  name?: string;
  email?: string;
};

export type SidebarNavItem = {
  to: string;
  label: string;
  description?: string;
  icon: LucideIcon;
};

export type SidebarSection = {
  sectionLabel: string;
  items: SidebarNavItem[];
};

export type ConfigMenuItem = {
  label: string;
  onClick: () => void;
};

export type DashboardModuleProps = {
  portalName: string;
  portalRole: DashboardPortalRole;
  portalTagline?: string;
};

export type KpiCardsProps = {
  items: DashboardKpi[];
};

export type RevenueBarChartProps = {
  data: DashboardChartPoint[];
};

export type TeamMembersCardProps = {
  members: DashboardTeamMember[];
};

export type ActivityFeedCardProps = {
  activities: DashboardActivity[];
};

export type SpotlightListProps = {
  items: DashboardSpotlight[];
};

export type PaymentMethodsCardProps = {
  methods: DashboardSavedPaymentMethod[];
};

export type TransactionsTableProps = {
  transactions: DashboardTransaction[];
  onOpenTransaction: (transaction: DashboardTransaction) => void;
};

export type TransactionSheetProps = {
  transaction: DashboardTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
