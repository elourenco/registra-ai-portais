import { zodResolver } from "@hookform/resolvers/zod";
import {
  brazilStateOptions,
  formatCepInput,
  formatCnpj,
  lookupCep,
} from "@registra/shared";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Textarea,
} from "@registra/ui";
import { useForm } from "react-hook-form";

import {
  supplierDevelopmentCreateFormSchema,
  supplierDevelopmentLandProfileLabels,
  supplierDevelopmentModalityLabels,
  type SupplierDevelopmentCreateFormInput,
  type SupplierDevelopmentCreateFormValues,
} from "@/features/developments/core/development-create-schema";

interface DevelopmentFormProps {
  submitLabel: string;
  cancelLabel: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: SupplierDevelopmentCreateFormValues) => void | Promise<void>;
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
  submitLabel,
  cancelLabel,
  isSubmitting,
  onCancel,
  onSubmit,
}: DevelopmentFormProps) {
  const form = useForm<
    SupplierDevelopmentCreateFormInput,
    undefined,
    SupplierDevelopmentCreateFormValues
  >({
    resolver: zodResolver(supplierDevelopmentCreateFormSchema),
    defaultValues: {
      legalName: "",
      tradeName: "",
      speCnpj: "",
      name: "",
      postalCode: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "SP",
      totalTowers: 1,
      totalUnits: 1,
      largerAreaContributorNote: "",
      landProfile: "urban",
      developmentModality: "residential",
    },
  });

  const handlePostalCodeChange = (value: string) => {
    const formattedCep = formatCepInput(value);
    form.setValue("postalCode", formattedCep, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (formattedCep.replace(/\D/g, "").length !== 8) {
      return;
    }

    const lookup = lookupCep(formattedCep);
    if (!lookup) {
      return;
    }

    form.setValue("address", lookup.address, {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.setValue("neighborhood", lookup.neighborhood, {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.setValue("city", lookup.city, {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.setValue("state", lookup.state, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Dados principais</CardTitle>
          <CardDescription>
            Cadastro inicial do empreendimento no portal Supplier. O bloco de registro
            imobiliario fica para uma etapa posterior.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2 xl:col-span-2">
              <RequiredLabel htmlFor="development-legal-name">Nome razao social</RequiredLabel>
              <Input id="development-legal-name" {...form.register("legalName")} />
              <FieldError message={form.formState.errors.legalName?.message} />
            </div>

            <div className="space-y-2">
              <RequiredLabel htmlFor="development-trade-name">Nome fantasia</RequiredLabel>
              <Input id="development-trade-name" {...form.register("tradeName")} />
              <FieldError message={form.formState.errors.tradeName?.message} />
            </div>

            <div className="space-y-2">
              <RequiredLabel htmlFor="development-cnpj">CNPJ</RequiredLabel>
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
              <RequiredLabel htmlFor="development-name">Nome do empreendimento</RequiredLabel>
              <Input id="development-name" {...form.register("name")} />
              <FieldError message={form.formState.errors.name?.message} />
            </div>

            <div className="space-y-2">
              <RequiredLabel htmlFor="land-profile">Tipo de empreendimento</RequiredLabel>
              <Select id="land-profile" {...form.register("landProfile")}>
                {Object.entries(supplierDevelopmentLandProfileLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <FieldError message={form.formState.errors.landProfile?.message} />
            </div>

            <div className="space-y-2">
              <RequiredLabel htmlFor="development-modality">Modalidade do empreendimento</RequiredLabel>
              <Select id="development-modality" {...form.register("developmentModality")}>
                {Object.entries(supplierDevelopmentModalityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <FieldError message={form.formState.errors.developmentModality?.message} />
            </div>

            <div className="space-y-2 xl:col-span-3">
              <Label htmlFor="larger-area-contributor">
                Contribuinte se em area maior mencionar (se individualizado nao precisa mencionar)
              </Label>
              <Textarea
                id="larger-area-contributor"
                rows={3}
                {...form.register("largerAreaContributorNote")}
              />
              <FieldError message={form.formState.errors.largerAreaContributorNote?.message} />
            </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Endereco do empreendimento</CardTitle>
          <CardDescription>
            Campos de endereco seguem detalhados porque a API atual ainda exige esse payload
            estruturado no cadastro.
          </CardDescription>
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
            <RequiredLabel htmlFor="address">Endereco do empreendimento</RequiredLabel>
            <Input id="address" {...form.register("address")} />
            <FieldError message={form.formState.errors.address?.message} />
          </div>

          <div className="space-y-2">
            <RequiredLabel htmlFor="number">Numero</RequiredLabel>
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
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Volumetria</CardTitle>
          <CardDescription>
            Dados operacionais minimos para iniciar a esteira do empreendimento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <RequiredLabel htmlFor="towers">Torres</RequiredLabel>
            <Input
              id="towers"
              type="number"
              min={1}
              {...form.register("totalTowers", { valueAsNumber: true })}
            />
            <FieldError message={form.formState.errors.totalTowers?.message} />
          </div>

          <div className="space-y-2">
            <RequiredLabel htmlFor="units">Unidades</RequiredLabel>
            <Input
              id="units"
              type="number"
              min={1}
              {...form.register("totalUnits", { valueAsNumber: true })}
            />
            <FieldError message={form.formState.errors.totalUnits?.message} />
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
