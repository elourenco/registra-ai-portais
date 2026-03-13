import { zodResolver } from "@hookform/resolvers/zod";
import {
  formatCpfInput,
  formatPhoneInput,
} from "@registra/shared";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select } from "@registra/ui";
import { useForm } from "react-hook-form";

import {
  acquisitionTypeLabels,
  buyerRegistrationFormSchema,
  formatBuyerPurchaseValue,
  maritalLabels,
  type BuyerRegistrationFormInput,
  type BuyerRegistrationFormValues,
} from "@/features/developments/core/developments-schema";

interface BuyerFormProps {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: BuyerRegistrationFormValues) => void | Promise<void>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-rose-600">{message}</p>;
}

function RequiredLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-1">
      <span>{children}</span>
      <span className="text-rose-600">*</span>
    </Label>
  );
}

export function BuyerForm({ isSubmitting, onCancel, onSubmit }: BuyerFormProps) {
  const form = useForm<BuyerRegistrationFormInput, undefined, BuyerRegistrationFormValues>({
    resolver: zodResolver(buyerRegistrationFormSchema),
    defaultValues: {
      name: "",
      cpf: "",
      email: "",
      phone: "",
      maritalStatus: "single",
      nationality: "Brasileiro(a)",
      profession: "",
      unitLabel: "",
      acquisitionType: "financing",
      purchaseValue: "",
      contractDate: "",
      notes: "",
    },
  });

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Dados básicos do comprador</CardTitle>
          <CardDescription>Informações mínimas suportadas pela API atual.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2 xl:col-span-2">
            <RequiredLabel htmlFor="buyer-name">Nome completo</RequiredLabel>
            <Input id="buyer-name" {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="buyer-cpf">CPF</RequiredLabel>
            <Input
              id="buyer-cpf"
              value={form.watch("cpf") ?? ""}
              onChange={(event) => {
                form.setValue("cpf", formatCpfInput(event.currentTarget.value), {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
            <FieldError message={form.formState.errors.cpf?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="buyer-email">E-mail</RequiredLabel>
            <Input id="buyer-email" type="email" {...form.register("email")} />
            <FieldError message={form.formState.errors.email?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="buyer-phone">Telefone</RequiredLabel>
            <Input
              id="buyer-phone"
              value={form.watch("phone") ?? ""}
              onChange={(event) => {
                form.setValue("phone", formatPhoneInput(event.currentTarget.value), {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
            <FieldError message={form.formState.errors.phone?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="buyer-marital-status">Estado civil</RequiredLabel>
            <Select id="buyer-marital-status" {...form.register("maritalStatus")}>
              {Object.entries(maritalLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <FieldError message={form.formState.errors.maritalStatus?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="buyer-nationality">Nacionalidade</RequiredLabel>
            <Input id="buyer-nationality" {...form.register("nationality")} />
            <FieldError message={form.formState.errors.nationality?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="buyer-profession">Profissão</RequiredLabel>
            <Input id="buyer-profession" {...form.register("profession")} />
            <FieldError message={form.formState.errors.profession?.message} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Dados da compra do imóvel</CardTitle>
          <CardDescription>Campos complementares aceitos pelo contrato atual de criação do comprador.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <RequiredLabel htmlFor="unit-label">Unidade / lote</RequiredLabel>
            <Input id="unit-label" {...form.register("unitLabel")} placeholder="Ex.: Torre A - 1203" />
            <FieldError message={form.formState.errors.unitLabel?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="acquisition-type">Modalidade</RequiredLabel>
            <Select id="acquisition-type" {...form.register("acquisitionType")}>
              {Object.entries(acquisitionTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <FieldError message={form.formState.errors.acquisitionType?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="purchase-value">Valor da compra</RequiredLabel>
            <Input
              id="purchase-value"
              value={form.watch("purchaseValue") ?? ""}
              onChange={(event) => {
                form.setValue("purchaseValue", formatBuyerPurchaseValue(event.currentTarget.value), {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
            <FieldError message={form.formState.errors.purchaseValue?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="contract-date">Data do contrato</RequiredLabel>
            <Input id="contract-date" type="date" {...form.register("contractDate")} />
            <FieldError message={form.formState.errors.contractDate?.message} />
          </div>
          <div className="space-y-2 md:col-span-2 xl:col-span-3">
            <Label htmlFor="buyer-notes">Observações</Label>
            <textarea
              id="buyer-notes"
              {...form.register("notes")}
              className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ex.: compra com FGTS, assinatura pendente, composição de renda."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Salvar comprador
        </Button>
      </div>
    </form>
  );
}
