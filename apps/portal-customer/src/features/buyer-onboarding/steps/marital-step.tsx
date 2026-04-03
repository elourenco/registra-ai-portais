import { Button } from "@registra/ui";

import type { MaritalStatusOption, MaritalStatusValue } from "../buyer-onboarding.types";
import { StepLayout } from "../components/step-layout";

interface MaritalStepProps {
  value: MaritalStatusValue;
  currentStep: number;
  totalSteps: number;
  onChange: (value: MaritalStatusOption) => void;
  onContinue: (value: MaritalStatusOption) => void;
  onBack: () => void;
}

export function MaritalStep({
  value,
  currentStep,
  totalSteps,
  onChange,
  onContinue,
  onBack,
}: MaritalStepProps) {
  const selectedValue = value || undefined;

  return (
    <StepLayout
      title="Defina seu estado civil"
      description="Essa resposta define automaticamente os próximos passos e documentos da jornada."
      cardTitle="Selecione uma opção"
      currentStep={currentStep}
      totalSteps={totalSteps}
      primaryActionLabel="Continuar"
      onPrimaryAction={selectedValue ? () => onContinue(selectedValue) : undefined}
      primaryDisabled={!value}
      onBackAction={onBack}
      footerHint="A jornada se adapta dinamicamente ao seu contexto."
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Button
            type="button"
            variant={value === "single" ? "default" : "outline"}
            className={value === "single" ? undefined : "hover:bg-secondary hover:text-foreground"}
            onClick={() => onChange("single")}
          >
            Solteiro
          </Button>
          <Button
            type="button"
            variant={value === "married" ? "default" : "outline"}
            className={value === "married" ? undefined : "hover:bg-secondary hover:text-foreground"}
            onClick={() => onChange("married")}
          >
            Casado
          </Button>
          <Button
            type="button"
            variant={value === "stable_union" ? "default" : "outline"}
            className={
              value === "stable_union" ? undefined : "hover:bg-secondary hover:text-foreground"
            }
            onClick={() => onChange("stable_union")}
          >
            União estável
          </Button>
        </div>
      </div>
    </StepLayout>
  );
}
