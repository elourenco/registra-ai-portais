import { zodResolver } from "@hookform/resolvers/zod";
import { formatCnpjInput, formatCpfInput } from "@registra/shared";
import { Input, Label, Tabs, TabsContent, TabsList, TabsTrigger } from "@registra/ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import type { BuyerAccessData } from "../buyer-onboarding.types";
import { StepLayout } from "../components/step-layout";
import { loginStepSchema } from "../core/buyer-onboarding-validation";

interface LoginStepProps {
  value: BuyerAccessData;
  currentStep: number;
  totalSteps: number;
  isLoading: boolean;
  onChange: (value: BuyerAccessData) => void;
  onContinue: (value: BuyerAccessData) => void;
}

export function LoginStep({
  value,
  currentStep,
  totalSteps,
  isLoading,
  onChange,
  onContinue,
}: LoginStepProps) {
  const form = useForm<BuyerAccessData>({
    resolver: zodResolver(loginStepSchema),
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
        identifierType: nextValue.identifierType ?? "cpf",
        documentNumber: nextValue.documentNumber ?? "",
        accessCode: nextValue.accessCode ?? "",
      });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <StepLayout
      title="Valide o seu acesso"
      description="Informe seu CPF ou CNPJ e o código de acesso recebido para iniciar a jornada."
      currentStep={currentStep}
      totalSteps={totalSteps}
      primaryActionLabel="Continuar"
      primaryDisabled={!form.formState.isValid}
      primaryLoading={isLoading}
      onPrimaryAction={form.handleSubmit(onContinue)}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Documento</Label>
          <Tabs
            value={form.watch("identifierType")}
            onValueChange={(nextValue) => {
              const identifierType = nextValue as BuyerAccessData["identifierType"];
              form.setValue("identifierType", identifierType, {
                shouldDirty: true,
                shouldValidate: true,
              });
              form.setValue("documentNumber", "", {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cpf">CPF</TabsTrigger>
              <TabsTrigger value="cnpj">CNPJ</TabsTrigger>
            </TabsList>

            <TabsContent value="cpf" className="space-y-2">
              <Input
                id="buyer-cpf"
                autoFocus
                placeholder="000.000.000-00"
                {...form.register("documentNumber", {
                  onChange: (event) => {
                    const maskedValue = formatCpfInput(event.target.value);
                    form.setValue("documentNumber", maskedValue, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  },
                })}
              />
            </TabsContent>

            <TabsContent value="cnpj" className="space-y-2">
              <Input
                id="buyer-cnpj"
                autoFocus
                placeholder="00.000.000/0000-00"
                {...form.register("documentNumber", {
                  onChange: (event) => {
                    const maskedValue = formatCnpjInput(event.target.value);
                    form.setValue("documentNumber", maskedValue, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  },
                })}
              />
            </TabsContent>
          </Tabs>
          {form.formState.errors.documentNumber ? (
            <p className="text-sm text-destructive">{form.formState.errors.documentNumber.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="buyer-access-code">Código de acesso</Label>
          <Input
            id="buyer-access-code"
            placeholder="Digite o código recebido"
            {...form.register("accessCode")}
          />
          {form.formState.errors.accessCode ? (
            <p className="text-sm text-destructive">{form.formState.errors.accessCode.message}</p>
          ) : null}
        </div>
      </div>
    </StepLayout>
  );
}
