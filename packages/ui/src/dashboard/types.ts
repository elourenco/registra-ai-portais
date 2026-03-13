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
import type { ComponentType } from "react";

export type PortalUser = {
  name?: string;
  email?: string;
};

export type SidebarNavItem = {
  to: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  exact?: boolean;
  inset?: boolean;
  activePatterns?: string[];
};

export type SidebarSection = {
  sectionLabel: string;
  items: SidebarNavItem[];
};

export type ContextSidebarConfig = {
  title: string;
  description?: string;
  sections: SidebarSection[];
};

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

export type HeaderAction = {
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: "default" | "secondary" | "outline" | "ghost";
};

export type HeaderLeadingAction = {
  ariaLabel: string;
  to?: string;
  onClick?: () => void;
};

export type HeaderUtilityAction = {
  ariaLabel: string;
  icon: HeaderIcon;
  to?: string;
  onClick?: () => void;
};

export type HeaderIcon = LucideIcon | ComponentType<{ className?: string }>;

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
