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
      cardTitle="Confirme o seu empreendimento"
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
      <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Empreendimento vinculado ao seu processo
          </p>
          <div className="h-px flex-1 bg-gradient-to-r from-slate-200/80 to-transparent" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Empreendimento
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-foreground">{value.name}</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              CNPJ
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-foreground">
              {formatCnpjInput(value.cnpj)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Unidade
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-foreground">{value.unitLabel}</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Forma de aquisição
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-foreground">
              {value.acquisitionType}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:col-span-2">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Valor da compra
                </p>
                <p className="mt-2 text-base font-semibold leading-6 text-foreground">
                  {value.purchaseValue}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Valor confirmado
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Endereço
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-foreground">{value.address}</p>
          </div>
        </div>
      </section>
    </StepLayout>
  );
}
