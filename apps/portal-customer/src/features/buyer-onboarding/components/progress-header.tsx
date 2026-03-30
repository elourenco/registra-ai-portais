import { Badge, Progress } from "@registra/ui";

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
      <div className="flex items-center justify-between gap-3">
        <Badge variant="outline">{`Passo ${currentStep} de ${totalSteps}`}</Badge>
        <span className="text-sm text-muted-foreground">{progressValue}% concluído</span>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Progress value={progressValue} />
    </div>
  );
}
