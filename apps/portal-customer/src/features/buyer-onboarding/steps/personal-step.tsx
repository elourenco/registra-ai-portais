import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Label } from "@registra/ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { BuyerIdentifierType, PersonalData } from "../buyer-onboarding.types";
import { StepLayout } from "../components/step-layout";

const personalSchema = z.object({
  fullName: z.string().trim().min(3, "Informe seu nome completo."),
  cpf: z.string().trim().min(11, "CPF inválido."),
  birthDate: z.string().trim().min(1, "Informe a data de nascimento."),
  nationality: z.string().trim().min(2, "Informe a nacionalidade."),
  profession: z.string().trim().min(2, "Informe a profissão."),
  email: z.string().trim().email("Informe um e-mail válido."),
  phone: z.string().trim().min(10, "Informe um telefone válido."),
});

interface PersonalStepProps {
  value: PersonalData;
  identifierType: BuyerIdentifierType;
  currentStep: number;
  totalSteps: number;
  onChange: (value: PersonalData) => void;
  onContinue: (value: PersonalData) => void;
  onBack: () => void;
}

export function PersonalStep({
  value,
  identifierType,
  currentStep,
  totalSteps,
  onChange,
  onContinue,
  onBack,
}: PersonalStepProps) {
  const isCompanyFlow = identifierType === "cnpj";
  const form = useForm<PersonalData>({
    resolver: zodResolver(personalSchema),
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
        nationality: nextValue.nationality ?? "",
        profession: nextValue.profession ?? "",
        email: nextValue.email ?? "",
        phone: nextValue.phone ?? "",
      });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <StepLayout
      title={isCompanyFlow ? "Dados da empresa" : "Seus dados pessoais"}
      description={
        isCompanyFlow
          ? "Preencha os dados cadastrais da empresa responsável. Tudo é salvo automaticamente conforme você avança."
          : "Preencha os dados abaixo. Tudo é salvo automaticamente conforme você avança."
      }
      currentStep={currentStep}
      totalSteps={totalSteps}
      primaryActionLabel="Continuar"
      primaryDisabled={!form.formState.isValid}
      onPrimaryAction={form.handleSubmit(onContinue)}
      onBackAction={onBack}
      footerHint="Salvo automaticamente."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="personal-full-name">{isCompanyFlow ? "Razão social" : "Nome completo"}</Label>
          <Input id="personal-full-name" {...form.register("fullName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="personal-cpf">{isCompanyFlow ? "CNPJ" : "CPF"}</Label>
          <Input id="personal-cpf" readOnly {...form.register("cpf")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="personal-birth-date">
            {isCompanyFlow ? "Data de constituição" : "Data de nascimento"}
          </Label>
          <Input id="personal-birth-date" type="date" {...form.register("birthDate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="personal-nationality">
            {isCompanyFlow ? "Natureza jurídica" : "Nacionalidade"}
          </Label>
          <Input id="personal-nationality" {...form.register("nationality")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="personal-profession">
            {isCompanyFlow ? "Nome do responsável legal" : "Profissão"}
          </Label>
          <Input id="personal-profession" {...form.register("profession")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="personal-email">
            {isCompanyFlow ? "E-mail da empresa" : "E-mail"}
          </Label>
          <Input id="personal-email" type="email" {...form.register("email")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="personal-phone">
            {isCompanyFlow ? "Telefone da empresa" : "Telefone"}
          </Label>
          <Input id="personal-phone" {...form.register("phone")} />
        </div>
      </div>
    </StepLayout>
  );
}
