import { zodResolver } from "@hookform/resolvers/zod";
import {
  formatCpfInput,
  formatPhoneInput,
  type AvailabilityItem,
} from "@registra/shared";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select } from "@registra/ui";
import { useEffect } from "react";
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
  availableItems?: AvailabilityItem[];
  initialValues?: Partial<BuyerRegistrationFormInput>;
  showBasicSection?: boolean;
  showPurchaseSection?: boolean;
  wrapPurchaseSectionInCard?: boolean;
  purchaseFieldsClassName?: string;
  isSubmitting: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  basicSectionTitle?: string;
  basicSectionDescription?: string;
  purchaseSectionTitle?: string;
  purchaseSectionDescription?: string;
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

export function BuyerForm({
  availableItems = [],
  initialValues,
  showBasicSection = true,
  showPurchaseSection = true,
  wrapPurchaseSectionInCard = true,
  purchaseFieldsClassName = "grid gap-4 md:grid-cols-2",
  isSubmitting,
  submitLabel = "Salvar comprador",
  cancelLabel = "Cancelar",
  basicSectionTitle = "Dados básicos do comprador",
  basicSectionDescription = "Informações mínimas suportadas pela API atual.",
  purchaseSectionTitle = "Dados da compra do imóvel",
  purchaseSectionDescription = "Campos complementares aceitos pelo contrato atual de criação do comprador.",
  onCancel,
  onSubmit,
}: BuyerFormProps) {
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
      availabilityItemId: "",
      unitLabel: "",
      acquisitionType: "financing",
      purchaseValue: "",
      contractDate: "",
      notes: "",
      ...initialValues,
    },
  });
  const hasStructuredAvailability = availableItems.length > 0;

  useEffect(() => {
    form.reset({
      name: "",
      cpf: "",
      email: "",
      phone: "",
      maritalStatus: "single",
      nationality: "Brasileiro(a)",
      profession: "",
      availabilityItemId: "",
      unitLabel: "",
      acquisitionType: "financing",
      purchaseValue: "",
      contractDate: "",
      notes: "",
      ...initialValues,
    });
  }, [form, initialValues]);

  useEffect(() => {
    if (!hasStructuredAvailability) {
      return;
    }

    const currentAvailabilityItemId = form.getValues("availabilityItemId");
    const currentUnitLabel = form.getValues("unitLabel");

    if (currentAvailabilityItemId) {
      return;
    }

    const matchedItem = availableItems.find((item) => item.displayLabel === currentUnitLabel);
    if (!matchedItem) {
      return;
    }

    form.setValue("availabilityItemId", matchedItem.id, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [availableItems, form, hasStructuredAvailability]);

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      {showBasicSection ? (
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>{basicSectionTitle}</CardTitle>
            <CardDescription>{basicSectionDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
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
      ) : null}

      {showPurchaseSection ? (
        wrapPurchaseSectionInCard ? (
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle>{purchaseSectionTitle}</CardTitle>
              <CardDescription>{purchaseSectionDescription}</CardDescription>
            </CardHeader>
            <CardContent className={purchaseFieldsClassName}>
              <div className="space-y-2">
                <RequiredLabel htmlFor="unit-label">Unidade / lote</RequiredLabel>
                {hasStructuredAvailability ? (
                  <Select
                    id="unit-label"
                    value={form.watch("availabilityItemId") ?? ""}
                    onChange={(event) => {
                      const selectedId = event.currentTarget.value;
                      const selectedItem = availableItems.find((item) => item.id === selectedId) ?? null;

                      form.setValue("availabilityItemId", selectedId, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      form.setValue("unitLabel", selectedItem?.displayLabel ?? "", {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  >
                    <option value="">Selecione uma unidade disponível</option>
                    {availableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.displayLabel}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input id="unit-label" {...form.register("unitLabel")} placeholder="Ex.: Torre A - 1203" />
                )}
                {hasStructuredAvailability ? (
                  <p className="text-xs text-muted-foreground">
                    Lista gerada a partir da disponibilidade cadastrada no empreendimento.
                  </p>
                ) : null}
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
              <div className="space-y-2 md:col-span-2">
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
        ) : (
          <div className="space-y-4">
            {purchaseSectionTitle || purchaseSectionDescription ? (
              <div>
                {purchaseSectionTitle ? (
                  <h3 className="text-base font-semibold text-foreground">{purchaseSectionTitle}</h3>
                ) : null}
                {purchaseSectionDescription ? (
                  <p className="text-sm text-muted-foreground">{purchaseSectionDescription}</p>
                ) : null}
              </div>
            ) : null}
            <div className={purchaseFieldsClassName}>
              <div className="space-y-2">
                <RequiredLabel htmlFor="unit-label">Unidade / lote</RequiredLabel>
                {hasStructuredAvailability ? (
                  <Select
                    id="unit-label"
                    value={form.watch("availabilityItemId") ?? ""}
                    onChange={(event) => {
                      const selectedId = event.currentTarget.value;
                      const selectedItem = availableItems.find((item) => item.id === selectedId) ?? null;

                      form.setValue("availabilityItemId", selectedId, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      form.setValue("unitLabel", selectedItem?.displayLabel ?? "", {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  >
                    <option value="">Selecione uma unidade disponível</option>
                    {availableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.displayLabel}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input id="unit-label" {...form.register("unitLabel")} placeholder="Ex.: Torre A - 1203" />
                )}
                {hasStructuredAvailability ? (
                  <p className="text-xs text-muted-foreground">
                    Lista gerada a partir da disponibilidade cadastrada no empreendimento.
                  </p>
                ) : null}
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="buyer-notes">Observações</Label>
                <textarea
                  id="buyer-notes"
                  {...form.register("notes")}
                  className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Ex.: compra com FGTS, assinatura pendente, composição de renda."
                />
              </div>
            </div>
          </div>
        )
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
