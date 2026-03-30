import { Badge, Card, CardContent } from "@registra/ui";

import type { PropertyConfirmation } from "../buyer-onboarding.types";
import { StepLayout } from "../components/step-layout";

interface EmpreendimentoStepProps {
  value: PropertyConfirmation;
  currentStep: number;
  totalSteps: number;
  onConfirm: () => void;
  onBack?: () => void;
}

export function EmpreendimentoStep({
  value,
  currentStep,
  totalSteps,
  onConfirm,
  onBack,
}: EmpreendimentoStepProps) {
  return (
    <StepLayout
      title="Confirme o seu empreendimento"
      description="Você está iniciando o processo de registro do seu imóvel."
      currentStep={currentStep}
      totalSteps={totalSteps}
      primaryActionLabel="Confirmar"
      onPrimaryAction={onConfirm}
      onBackAction={onBack}
    >
      <Card className="border-border/70 bg-muted/20 shadow-none">
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Empreendimento</p>
            <p className="text-sm font-medium text-foreground">{value.empreendimento}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Unidade</p>
            <p className="text-sm font-medium text-foreground">{value.unidade}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Cidade</p>
            <p className="text-sm font-medium text-foreground">{value.cidade}</p>
          </div>
        </CardContent>
      </Card>

      <Badge variant="outline">Processo vinculado ao imóvel selecionado</Badge>
    </StepLayout>
  );
}
