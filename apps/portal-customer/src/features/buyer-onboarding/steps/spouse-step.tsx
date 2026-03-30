import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Label } from "@registra/ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { SpouseData } from "../buyer-onboarding.types";
import { StepLayout } from "../components/step-layout";

const spouseSchema = z.object({
  fullName: z.string().trim().min(3, "Informe o nome completo do cônjuge."),
  cpf: z.string().trim().min(11, "Informe um CPF válido."),
  birthDate: z.string().trim().min(1, "Informe a data de nascimento."),
  email: z.string().trim().email("Informe um e-mail válido."),
  phone: z.string().trim().min(10, "Informe um telefone válido."),
});

interface SpouseStepProps {
  value: SpouseData;
  currentStep: number;
  totalSteps: number;
  onChange: (value: SpouseData) => void;
  onContinue: (value: SpouseData) => void;
  onBack: () => void;
}

export function SpouseStep({
  value,
  currentStep,
  totalSteps,
  onChange,
  onContinue,
  onBack,
}: SpouseStepProps) {
  const form = useForm<SpouseData>({
    resolver: zodResolver(spouseSchema),
    mode: "onChange",
    defaultValues: value,
  });

  useEffect(() => {
    form.reset(value);
  }, [form, value]);

  useEffect(() => {
    const subscription = form.watch((nextValue) => {
      onChange({
        fullName: nextValue.fullName ?? "",
        cpf: nextValue.cpf ?? "",
        birthDate: nextValue.birthDate ?? "",
        email: nextValue.email ?? "",
        phone: nextValue.phone ?? "",
      });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <StepLayout
      title="Dados do cônjuge"
      description="Precisamos desses dados para completar a análise do imóvel com segurança."
      currentStep={currentStep}
      totalSteps={totalSteps}
      primaryActionLabel="Continuar"
      primaryDisabled={!form.formState.isValid}
      onPrimaryAction={form.handleSubmit(onContinue)}
      onBackAction={onBack}
      footerHint="Esta etapa aparece apenas para casado ou união estável."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="spouse-full-name">Nome completo</Label>
          <Input id="spouse-full-name" {...form.register("fullName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="spouse-cpf">CPF</Label>
          <Input id="spouse-cpf" {...form.register("cpf")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="spouse-birth-date">Data de nascimento</Label>
          <Input id="spouse-birth-date" type="date" {...form.register("birthDate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="spouse-email">E-mail</Label>
          <Input id="spouse-email" type="email" {...form.register("email")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="spouse-phone">Telefone</Label>
          <Input id="spouse-phone" {...form.register("phone")} />
        </div>
      </div>
    </StepLayout>
  );
}
