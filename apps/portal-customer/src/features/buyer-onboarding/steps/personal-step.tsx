import { zodResolver } from "@hookform/resolvers/zod";
import { formatPhoneInput } from "@registra/shared";
import { Input, Label } from "@registra/ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import type { BuyerIdentifierType, PersonalData } from "../buyer-onboarding.types";
import { StepLayout } from "../components/step-layout";
import { createPersonalSchema } from "../core/buyer-onboarding-validation";

interface PersonalStepProps {
  value: PersonalData;
  identifierType: BuyerIdentifierType;
  currentStep: number;
  totalSteps: number;
  onChange: (value: PersonalData) => void;
  onContinue: (value: PersonalData) => void;
  onBack: () => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-rose-600">{message}</p>;
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
    resolver: zodResolver(createPersonalSchema(isCompanyFlow)),
    mode: "onChange",
    defaultValues: value,
  });

  useEffect(() => {
    form.reset(value);
    void form.trigger();
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
          <FieldError message={form.formState.errors.fullName?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="personal-cpf">{isCompanyFlow ? "CNPJ" : "CPF"}</Label>
          <Input id="personal-cpf" readOnly {...form.register("cpf")} />
          <FieldError message={form.formState.errors.cpf?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="personal-birth-date">
            {isCompanyFlow ? "Data de constituição" : "Data de nascimento"}
          </Label>
          <Input id="personal-birth-date" type="date" {...form.register("birthDate")} />
          <FieldError message={form.formState.errors.birthDate?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="personal-nationality">
            {isCompanyFlow ? "Natureza jurídica" : "Nacionalidade"}
          </Label>
          <Input id="personal-nationality" {...form.register("nationality")} />
          <FieldError message={form.formState.errors.nationality?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="personal-profession">
            {isCompanyFlow ? "Nome do responsável legal" : "Profissão"}
          </Label>
          <Input id="personal-profession" {...form.register("profession")} />
          <FieldError message={form.formState.errors.profession?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="personal-email">
            {isCompanyFlow ? "E-mail da empresa" : "E-mail"}
          </Label>
          <Input id="personal-email" type="email" {...form.register("email")} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="personal-phone">
            {isCompanyFlow ? "Telefone da empresa" : "Telefone"}
          </Label>
          <Input
            id="personal-phone"
            inputMode="numeric"
            {...form.register("phone", {
              onChange: (event) => {
                form.setValue("phone", formatPhoneInput(event.target.value), {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              },
            })}
          />
          <FieldError message={form.formState.errors.phone?.message} />
        </div>
      </div>
    </StepLayout>
  );
}
