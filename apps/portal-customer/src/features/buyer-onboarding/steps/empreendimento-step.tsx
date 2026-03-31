import { Badge, Card, CardContent } from "@registra/ui";
import { formatCnpjInput } from "@registra/shared";

import type { PropertyConfirmation } from "../buyer-onboarding.types";
import { StepLayout } from "../components/step-layout";

interface EmpreendimentoStepProps {
  value: PropertyConfirmation;
  currentStep: number;
  totalSteps: number;
  onConfirm: () => void;
  onBack?: () => void;
  primaryDisabled?: boolean;
}

export function EmpreendimentoStep({
  value,
  currentStep,
  totalSteps,
  onConfirm,
  onBack,
  primaryDisabled,
}: EmpreendimentoStepProps) {
  return (
    <StepLayout
      title="Confirme o seu empreendimento"
      description="Você está iniciando o processo de registro do seu imóvel."
      currentStep={currentStep}
      totalSteps={totalSteps}
      primaryActionLabel="Confirmar"
      onPrimaryAction={onConfirm}
      primaryDisabled={primaryDisabled}
      onBackAction={onBack}
    >
      <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-none">
        <CardContent className="space-y-4 px-5 py-5 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Empreendimento vinculado ao seu processo
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Empreendimento
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                {value.name}
              </p>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                CNPJ
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                {formatCnpjInput(value.cnpj)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Unidade
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                {value.unitLabel}
              </p>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Forma de aquisicao
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                {value.acquisitionType}
              </p>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Valor da compra
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                {value.purchaseValue}
              </p>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Endereco
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                {value.address}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Badge variant="outline">Confira os dados antes de seguir para o cadastro</Badge>
    </StepLayout>
  );
}
