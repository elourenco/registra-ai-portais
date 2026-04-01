import { Button, Card, CardContent, CardHeader, CardTitle } from "@registra/ui";
import type { PropsWithChildren, ReactNode } from "react";

import { ProgressHeader } from "./progress-header";

interface StepLayoutProps extends PropsWithChildren {
  title: string;
  description: string;
  cardTitle?: string;
  currentStep: number;
  totalSteps: number;
  primaryActionLabel: string;
  onPrimaryAction?: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  onBackAction?: () => void;
  backActionLabel?: string;
  secondaryAction?: ReactNode;
  footerHint?: string;
}

export function StepLayout({
  title,
  description,
  cardTitle,
  currentStep,
  totalSteps,
  children,
  primaryActionLabel,
  onPrimaryAction,
  primaryDisabled,
  primaryLoading,
  onBackAction,
  backActionLabel = "Voltar",
  secondaryAction,
  footerHint,
}: StepLayoutProps) {
  return (
    <div className="space-y-6">
      <ProgressHeader
        title={title}
        description={description}
        currentStep={currentStep}
        totalSteps={totalSteps}
      />

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">{cardTitle ?? title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:items-center">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
              {onBackAction ? (
                <Button type="button" variant="outline" onClick={onBackAction}>
                  {backActionLabel}
                </Button>
              ) : null}
              {secondaryAction}
              <Button
                type="button"
                onClick={onPrimaryAction}
                disabled={primaryDisabled || primaryLoading}
              >
                {primaryLoading ? "Carregando..." : primaryActionLabel}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
