import { formatCnpjInput } from "@registra/shared";
import { Button } from "@registra/ui";

import type { PropertyConfirmation } from "../buyer-onboarding.types";
import { StepLayout } from "../components/step-layout";

interface EmpreendimentoStepProps {
  value: PropertyConfirmation;
  title: string;
  currentStep: number;
  totalSteps: number;
  onConfirm: () => void;
  onReportError: () => void;
  onBack?: () => void;
  primaryDisabled?: boolean;
}

export function EmpreendimentoStep({
  value,
  title,
  currentStep,
  totalSteps,
  onConfirm,
  onReportError,
  onBack,
  primaryDisabled,
}: EmpreendimentoStepProps) {
  return (
    <StepLayout
      title={title}
      description="Você está iniciando o processo de registro do seu imóvel."
      cardTitle="Detalhes do empreendimento"
      currentStep={currentStep}
      totalSteps={totalSteps}
      primaryActionLabel="Confirmar"
      onPrimaryAction={onConfirm}
      primaryDisabled={primaryDisabled}
      onBackAction={onBack}
      secondaryAction={
        <Button type="button" variant="outline" onClick={onReportError}>
          Reportar erro
        </Button>
      }
    >
      <ul className="divide-y divide-slate-200/80 rounded-2xl border border-slate-200/80 bg-white">
        <li className="grid gap-1 px-4 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Empreendimento
          </span>
          <span className="text-sm font-medium leading-6 text-foreground">{value.name}</span>
        </li>
        <li className="grid gap-1 px-4 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            CNPJ
          </span>
          <span className="text-sm font-medium leading-6 text-foreground">
            {formatCnpjInput(value.cnpj)}
          </span>
        </li>
        <li className="grid gap-1 px-4 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Unidade
          </span>
          <span className="text-sm font-medium leading-6 text-foreground">{value.unitLabel}</span>
        </li>
        <li className="grid gap-1 px-4 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Forma de aquisição
          </span>
          <span className="text-sm font-medium leading-6 text-foreground">
            {value.acquisitionType}
          </span>
        </li>
        <li className="grid gap-1 px-4 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Valor da compra
          </span>
          <span className="text-sm font-semibold leading-6 text-foreground">
            {value.purchaseValue}
          </span>
        </li>
        <li className="grid gap-1 px-4 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Endereço
          </span>
          <span className="text-sm font-medium leading-6 text-foreground">{value.address}</span>
        </li>
      </ul>
    </StepLayout>
  );
}
