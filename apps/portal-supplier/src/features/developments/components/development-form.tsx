import { zodResolver } from "@hookform/resolvers/zod";
import {
  brazilStateOptions,
  developmentRegistrationFormSchema,
  formatCepInput,
  formatCnpj,
  lookupCep,
  type DevelopmentRegistrationFormInput,
  type DevelopmentRegistrationFormValues,
} from "@registra/shared";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select } from "@registra/ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface DevelopmentFormProps {
  defaultValues?: Partial<DevelopmentRegistrationFormValues>;
  submitLabel: string;
  cancelLabel: string;
  isSubmitting: boolean;
  disableSupplierFields?: boolean;
  onCancel: () => void;
  onSubmit: (values: DevelopmentRegistrationFormValues) => void | Promise<void>;
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

export function DevelopmentForm({
  defaultValues,
  submitLabel,
  cancelLabel,
  isSubmitting,
  disableSupplierFields = true,
  onCancel,
  onSubmit,
}: DevelopmentFormProps) {
  const form = useForm<
    DevelopmentRegistrationFormInput,
    undefined,
    DevelopmentRegistrationFormValues
  >({
    resolver: zodResolver(developmentRegistrationFormSchema),
    defaultValues: {
      name: "",
      developmentType: "residential",
      speCnpj: "",
      legalName: "",
      tradeName: "",
      supplierId: defaultValues?.supplierId ?? "",
      supplierCustomName: defaultValues?.supplierCustomName ?? "",
      incorporationRegistrationNumber: "",
      incorporationRegistrationDate: "",
      masterRegistrationNumber: "",
      postalCode: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "SP",
      registryOfficeName: "",
      registryOfficeNumber: "",
      registryOfficeCity: "",
      registryOfficeState: "SP",
      totalUnits: 1,
      totalTowers: 1,
      parkingSpots: 0,
      status: "drafting",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        ...form.getValues(),
        ...defaultValues,
      });
    }
  }, [defaultValues, form]);

  const handlePostalCodeChange = (value: string) => {
    const formattedCep = formatCepInput(value);
    form.setValue("postalCode", formattedCep, { shouldValidate: true, shouldDirty: true });

    if (formattedCep.replace(/\D/g, "").length !== 8) {
      return;
    }

    const lookup = lookupCep(formattedCep);
    if (!lookup) {
      return;
    }

    form.setValue("address", lookup.address, { shouldValidate: true, shouldDirty: true });
    form.setValue("neighborhood", lookup.neighborhood, { shouldValidate: true, shouldDirty: true });
    form.setValue("city", lookup.city, { shouldValidate: true, shouldDirty: true });
    form.setValue("state", lookup.state, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Dados principais</CardTitle>
          <CardDescription>Identificação jurídica e operacional do empreendimento.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <RequiredLabel htmlFor="development-name">Nome do empreendimento</RequiredLabel>
            <Input id="development-name" {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="development-type">Tipo de empreendimento</RequiredLabel>
            <Select id="development-type" {...form.register("developmentType")}>
              <option value="residential">Residencial</option>
              <option value="commercial">Comercial</option>
              <option value="mixed">Misto</option>
              <option value="land_subdivision">Loteamento</option>
            </Select>
            <FieldError message={form.formState.errors.developmentType?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="development-status">Status</RequiredLabel>
            <Select id="development-status" {...form.register("status")}>
              <option value="drafting">Em cadastro</option>
              <option value="commercialization">Em comercialização</option>
              <option value="registry">Em registro</option>
              <option value="completed">Concluído</option>
            </Select>
            <FieldError message={form.formState.errors.status?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="development-cnpj">CNPJ da SPE</RequiredLabel>
            <Input
              id="development-cnpj"
              value={form.watch("speCnpj") ?? ""}
              onChange={(event) => {
                form.setValue("speCnpj", formatCnpj(event.currentTarget.value), {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
            <FieldError message={form.formState.errors.speCnpj?.message} />
          </div>
          <div className="space-y-2 xl:col-span-2">
            <RequiredLabel htmlFor="development-legal-name">Razão social</RequiredLabel>
            <Input id="development-legal-name" {...form.register("legalName")} />
            <FieldError message={form.formState.errors.legalName?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="development-trade-name">Nome fantasia</Label>
            <Input id="development-trade-name" {...form.register("tradeName")} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="supplier-id">Supplier responsável</RequiredLabel>
            <Input
              id="supplier-id"
              {...form.register("supplierId")}
              disabled={disableSupplierFields}
              placeholder="Preenchido automaticamente pela sessão"
            />
            <FieldError message={form.formState.errors.supplierId?.message} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Registro imobiliário</CardTitle>
          <CardDescription>Dados obrigatórios para o dossiê do empreendimento.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <RequiredLabel htmlFor="incorporation-number">Registro da incorporação</RequiredLabel>
            <Input id="incorporation-number" {...form.register("incorporationRegistrationNumber")} />
            <FieldError message={form.formState.errors.incorporationRegistrationNumber?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="incorporation-date">Data do registro</RequiredLabel>
            <Input id="incorporation-date" type="date" {...form.register("incorporationRegistrationDate")} />
            <FieldError message={form.formState.errors.incorporationRegistrationDate?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="master-registration">Matrícula mãe</RequiredLabel>
            <Input id="master-registration" {...form.register("masterRegistrationNumber")} />
            <FieldError message={form.formState.errors.masterRegistrationNumber?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="registry-name">Cartório</RequiredLabel>
            <Input id="registry-name" {...form.register("registryOfficeName")} />
            <FieldError message={form.formState.errors.registryOfficeName?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="registry-number">Número do cartório</RequiredLabel>
            <Input id="registry-number" {...form.register("registryOfficeNumber")} />
            <FieldError message={form.formState.errors.registryOfficeNumber?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="registry-city">Cidade do cartório</RequiredLabel>
            <Input id="registry-city" {...form.register("registryOfficeCity")} />
            <FieldError message={form.formState.errors.registryOfficeCity?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="registry-state">UF do cartório</RequiredLabel>
            <Select id="registry-state" {...form.register("registryOfficeState")}>
              {brazilStateOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <FieldError message={form.formState.errors.registryOfficeState?.message} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Endereço e volumetria</CardTitle>
          <CardDescription>Localização do empreendimento e capacidade operacional.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <RequiredLabel htmlFor="postal-code">CEP</RequiredLabel>
            <Input
              id="postal-code"
              value={form.watch("postalCode") ?? ""}
              onChange={(event) => handlePostalCodeChange(event.currentTarget.value)}
            />
            <FieldError message={form.formState.errors.postalCode?.message} />
          </div>
          <div className="space-y-2 xl:col-span-2">
            <RequiredLabel htmlFor="address">Endereço</RequiredLabel>
            <Input id="address" {...form.register("address")} />
            <FieldError message={form.formState.errors.address?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="number">Número</RequiredLabel>
            <Input id="number" {...form.register("number")} />
            <FieldError message={form.formState.errors.number?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complement">Complemento</Label>
            <Input id="complement" {...form.register("complement")} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="neighborhood">Bairro</RequiredLabel>
            <Input id="neighborhood" {...form.register("neighborhood")} />
            <FieldError message={form.formState.errors.neighborhood?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="city">Cidade</RequiredLabel>
            <Input id="city" {...form.register("city")} />
            <FieldError message={form.formState.errors.city?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="state">UF</RequiredLabel>
            <Select id="state" {...form.register("state")}>
              {brazilStateOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <FieldError message={form.formState.errors.state?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="units">Unidades</RequiredLabel>
            <Input id="units" type="number" min={1} {...form.register("totalUnits", { valueAsNumber: true })} />
            <FieldError message={form.formState.errors.totalUnits?.message} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="towers">Torres / blocos</RequiredLabel>
            <Input id="towers" type="number" min={1} {...form.register("totalTowers", { valueAsNumber: true })} />
            <FieldError message={form.formState.errors.totalTowers?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parking-spots">Vagas</Label>
            <Input id="parking-spots" type="number" min={0} {...form.register("parkingSpots", { valueAsNumber: true })} />
            <FieldError message={form.formState.errors.parkingSpots?.message} />
          </div>
        </CardContent>
      </Card>

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
