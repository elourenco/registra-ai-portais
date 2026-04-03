import { Progress } from "@registra/ui";

interface ProgressHeaderProps {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
}

export function ProgressHeader({
  title,
  description,
  currentStep,
  totalSteps,
}: ProgressHeaderProps) {
  const progressValue = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Etapa {currentStep} de {totalSteps}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Progress value={progressValue} />
    </div>
  );
}
