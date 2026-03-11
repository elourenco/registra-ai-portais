import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@registra/ui";
import type { LucideIcon } from "lucide-react";
import { cn } from "@registra/ui";

interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "warning" | "danger";
  footer?: string;
  onValueClick?: () => void;
  valueAriaLabel?: string;
}

const toneStyles = {
  neutral: {
    card: "border-border/70 bg-card/90",
    icon: "bg-primary/10 text-primary",
  },
  success: {
    card: "border-emerald-200 bg-emerald-50/80",
    icon: "bg-emerald-100 text-emerald-700",
  },
  warning: {
    card: "border-amber-200 bg-amber-50/80",
    icon: "bg-amber-100 text-amber-700",
  },
  danger: {
    card: "border-rose-200 bg-rose-50/80",
    icon: "bg-rose-100 text-rose-700",
  },
} as const;

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "neutral",
  footer,
  onValueClick,
  valueAriaLabel,
}: StatsCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card className={cn("shadow-sm", styles.card)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardDescription>{title}</CardDescription>
          {onValueClick ? (
            <button
              type="button"
              onClick={onValueClick}
              aria-label={valueAriaLabel ?? `Abrir detalhes de ${title}`}
              className="text-left"
            >
              <p className="text-3xl font-semibold underline-offset-4 transition hover:underline">{value}</p>
            </button>
          ) : (
            <p className="text-3xl font-semibold">{value}</p>
          )}
        </div>
        <div className={cn("rounded-xl p-2.5", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
        {footer ? <p className="mt-2 text-xs font-medium">{footer}</p> : null}
      </CardContent>
    </Card>
  );
}
