import { zodResolver } from "@hookform/resolvers/zod";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  buttonVariants,
} from "@registra/ui";
import {
  brazilStateOptions,
  developmentRegistrationFormSchema,
  developmentRegistrationStatusLabels,
  developmentRegistrationTypeLabels,
  formatCepInput,
  formatCnpj as formatCnpjMask,
  lookupCep,
  type DevelopmentRegistrationFormInput,
  type DevelopmentRegistrationFormValues,
} from "@registra/shared";
import { Building2, FileBadge2, MapPinned, Scale, Stamp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { useCreateDevelopmentMutation } from "@/features/developments/hooks/use-create-development-mutation";
import { useSuppliersQuery } from "@/features/suppliers/hooks/use-suppliers-query";
import { PageHeader } from "@/features/registration-core/components/page-header";
import { formatCnpj as formatSupplierCnpj } from "@/features/registration-core/core/registration-presenters";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { routes } from "@/shared/constants/routes";

const CUSTOM_SUPPLIER_VALUE = "__custom_supplier__";

function fieldError(message?: string) {
  return message ? <p className="text-xs text-rose-600">{message}</p> : null;
}

function RequiredLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-1">
      <span>{children}</span>
      <span className="text-rose-600">*</span>
    </Label>
  );
}

export function DevelopmentRegistrationPage() {
  const [savedSummary, setSavedSummary] = useState<string | null>(null);
  const [cepFeedback, setCepFeedback] = useState<string | null>(null);
  const suppliersQuery = useSuppliersQuery(1, 100);
  const createDevelopmentMutation = useCreateDevelopmentMutation();

  const form = useForm<
    DevelopmentRegistrationFormInput,
    undefined,
    DevelopmentRegistrationFormValues
  >({
    resolver: zodResolver(developmentRegistrationFormSchema),
    defaultValues: {
      developmentType: "residential",
      state: "SP",
      registryOfficeState: "SP",
      status: "drafting",
      totalUnits: 1,
      totalTowers: 1,
      parkingSpots: 0,
    },
  });

  const supplierId = form.watch("supplierId");
  const supplierCustomName = form.watch("supplierCustomName");
  const usingCustomSupplier = supplierId === CUSTOM_SUPPLIER_VALUE;
  const selectedSupplier = useMemo(
    () => suppliersQuery.data?.items.find((item) => item.id === supplierId) ?? null,
    [supplierId, suppliersQuery.data?.items],
  );

  const handlePostalCodeChange = (value: string) => {
    const formattedCep = formatCepInput(value);
    form.setValue("postalCode", formattedCep, { shouldValidate: true });

    const normalizedCepLength = formattedCep.replace(/\D/g, "").length;
    if (normalizedCepLength !== 8) {
      setCepFeedback(null);
      return;
    }

    const cepResult = lookupCep(formattedCep);
    if (!cepResult) {
      setCepFeedback("CEP preenchido manualmente. Não encontramos auto preenchimento na base local.");
      return;
    }

    form.setValue("address", cepResult.address, { shouldValidate: true });
    form.setValue("neighborhood", cepResult.neighborhood, { shouldValidate: true });
    form.setValue("city", cepResult.city, { shouldValidate: true });
    form.setValue("state", cepResult.state, { shouldValidate: true });
    setCepFeedback("CEP localizado. Endereço básico preenchido automaticamente.");
  };

  useEffect(() => {
    if (selectedSupplier) {
      form.clearErrors("supplierId");
    }
  }, [form, selectedSupplier]);

  useEffect(() => {
    if (usingCustomSupplier) {
      form.setValue("supplierId", CUSTOM_SUPPLIER_VALUE, { shouldValidate: true });
      return;
    }

    form.setValue("supplierCustomName", "", { shouldValidate: false });
  }, [form, usingCustomSupplier]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setSavedSummary(null);
    const createdDevelopment = await createDevelopmentMutation.mutateAsync(values);

    setSavedSummary(
      `${createdDevelopment.name} cadastrado para ${
        selectedSupplier?.legalName ?? values.supplierCustomName ?? "a incorporadora informada"
      }. Persistência realizada pela API do projeto.`,
    );
  });

  return (
    <section className="space-y-6">
      <PageHeader
        title="Cadastrar Empreendimento"
        description="Informações jurídicas e operacionais do empreendimento."
        actions={
          <Link to={routes.developments} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Cancelar
          </Link>
        }
      />

      {savedSummary ? (
        <Card className="border-emerald-200 bg-emerald-50/80">
          <CardContent className="p-5">
            <p className="font-medium text-emerald-700">{savedSummary}</p>
            <p className="mt-1 text-sm text-emerald-700/80">
              Dados validados no frontend e persistidos via API documentada no Swagger local.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {createDevelopmentMutation.isError ? (
        <Card className="border-rose-200 bg-rose-50/80">
          <CardContent className="p-5">
            <p className="font-medium text-rose-700">
              {getApiErrorMessage(
                createDevelopmentMutation.error,
                "Não foi possível cadastrar o empreendimento.",
              )}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Dados do empreendimento</CardTitle>
                <CardDescription>Identificação principal do projeto imobiliário.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <RequiredLabel htmlFor="development-name">Nome do empreendimento</RequiredLabel>
              <Input id="development-name" {...form.register("name")} placeholder="Ex.: Reserva das Palmeiras" />
              {fieldError(form.formState.errors.name?.message)}
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="development-type">Tipo de empreendimento</RequiredLabel>
              <Select id="development-type" {...form.register("developmentType")}>
                {Object.entries(developmentRegistrationTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              {fieldError(form.formState.errors.developmentType?.message)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Dados jurídicos do empreendimento (SPE)</CardTitle>
                <CardDescription>CNPJ próprio da SPE e vínculo com a incorporadora responsável.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <RequiredLabel htmlFor="spe-cnpj">CNPJ do empreendimento (SPE)</RequiredLabel>
              <Input
                id="spe-cnpj"
                {...form.register("speCnpj")}
                placeholder="00.000.000/0000-00"
                  onChange={(event) =>
                  form.setValue("speCnpj", formatCnpjMask(event.target.value), { shouldValidate: true })
                }
              />
              {fieldError(form.formState.errors.speCnpj?.message)}
            </div>
            <div className="space-y-2 xl:col-span-2">
              <RequiredLabel htmlFor="legal-name">Razão social do empreendimento</RequiredLabel>
              <Input id="legal-name" {...form.register("legalName")} placeholder="Razão social da SPE" />
              {fieldError(form.formState.errors.legalName?.message)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="trade-name">Nome fantasia do empreendimento</Label>
              <Input id="trade-name" {...form.register("tradeName")} placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="supplier-id">Incorporadora responsável</RequiredLabel>
              <Select
                id="supplier-id"
                {...form.register("supplierId")}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  form.setValue("supplierId", nextValue, { shouldValidate: true });
                  if (nextValue !== CUSTOM_SUPPLIER_VALUE) {
                    form.setValue("supplierCustomName", "", { shouldValidate: false });
                  }
                }}
              >
                <option value="">Selecione uma incorporadora</option>
                <option value={CUSTOM_SUPPLIER_VALUE}>Cadastrar novo nome</option>
                {suppliersQuery.data?.items.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.legalName}
                  </option>
                ))}
              </Select>
              {fieldError(form.formState.errors.supplierId?.message)}
            </div>
            {usingCustomSupplier ? (
              <div className="space-y-2">
                <RequiredLabel htmlFor="supplier-custom-name">Novo nome da incorporadora</RequiredLabel>
                <Input
                  id="supplier-custom-name"
                  {...form.register("supplierCustomName")}
                  placeholder="Informe o nome da incorporadora"
                />
                {fieldError(form.formState.errors.supplierCustomName?.message)}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="supplier-cnpj">CNPJ da incorporadora</Label>
              <Input
                id="supplier-cnpj"
                value={selectedSupplier ? formatSupplierCnpj(selectedSupplier.cnpj) : ""}
                placeholder={usingCustomSupplier ? "Preencha depois do cadastro do cliente" : "Autopreenchido"}
                readOnly
              />
              {selectedSupplier ? (
                <p className="text-xs text-muted-foreground">Preenchido automaticamente a partir do cliente selecionado.</p>
              ) : usingCustomSupplier ? (
                <p className="text-xs text-muted-foreground">Ao informar um novo nome, o CNPJ da incorporadora poderá ser cadastrado depois no cliente.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <FileBadge2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Registro da incorporação</CardTitle>
                <CardDescription>Dados formais da incorporação para suporte registral e contratual.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <RequiredLabel htmlFor="incorporation-registration-number">
                Número do registro da incorporação
              </RequiredLabel>
              <Input
                id="incorporation-registration-number"
                {...form.register("incorporationRegistrationNumber")}
                placeholder="Número do registro"
              />
              {fieldError(form.formState.errors.incorporationRegistrationNumber?.message)}
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="incorporation-registration-date">
                Data do registro da incorporação
              </RequiredLabel>
              <Input
                id="incorporation-registration-date"
                type="date"
                {...form.register("incorporationRegistrationDate")}
              />
              {fieldError(form.formState.errors.incorporationRegistrationDate?.message)}
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="master-registration-number">Matrícula mãe do empreendimento</RequiredLabel>
              <Input
                id="master-registration-number"
                {...form.register("masterRegistrationNumber")}
                placeholder="Número da matrícula mãe"
              />
              {fieldError(form.formState.errors.masterRegistrationNumber?.message)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <MapPinned className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Localização</CardTitle>
                <CardDescription>Endereço operacional do empreendimento com apoio de CEP.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <RequiredLabel htmlFor="postal-code">CEP</RequiredLabel>
                <Input
                  id="postal-code"
                  {...form.register("postalCode")}
                  placeholder="00000-000"
                  onChange={(event) => handlePostalCodeChange(event.target.value)}
                />
                {fieldError(form.formState.errors.postalCode?.message)}
              </div>
              <div className="space-y-2 xl:col-span-2">
                <RequiredLabel htmlFor="address">Endereço</RequiredLabel>
                <Input id="address" {...form.register("address")} placeholder="Rua, avenida ou alameda" />
                {fieldError(form.formState.errors.address?.message)}
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="address-number">Número</RequiredLabel>
                <Input id="address-number" {...form.register("number")} placeholder="Ex.: 1200" />
                {fieldError(form.formState.errors.number?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input id="complement" {...form.register("complement")} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="neighborhood">Bairro</RequiredLabel>
                <Input id="neighborhood" {...form.register("neighborhood")} placeholder="Bairro" />
                {fieldError(form.formState.errors.neighborhood?.message)}
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="city">Cidade</RequiredLabel>
                <Input id="city" {...form.register("city")} placeholder="Cidade" />
                {fieldError(form.formState.errors.city?.message)}
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="state">Estado</RequiredLabel>
                <Select id="state" {...form.register("state")}>
                  {brazilStateOptions.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </Select>
                {fieldError(form.formState.errors.state?.message)}
              </div>
            </div>

            {cepFeedback ? (
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                {cepFeedback}
              </Badge>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Stamp className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Cartório de Registro de Imóveis</CardTitle>
                <CardDescription>Cartório responsável pelo registro da incorporação e das matrículas.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <RequiredLabel htmlFor="registry-office-name">Nome do cartório</RequiredLabel>
              <Input id="registry-office-name" {...form.register("registryOfficeName")} placeholder="Nome do cartório" />
              {fieldError(form.formState.errors.registryOfficeName?.message)}
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="registry-office-number">Número do cartório</RequiredLabel>
              <Input id="registry-office-number" {...form.register("registryOfficeNumber")} placeholder="Ex.: 3º RGI" />
              {fieldError(form.formState.errors.registryOfficeNumber?.message)}
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="registry-office-city">Cidade do cartório</RequiredLabel>
              <Input id="registry-office-city" {...form.register("registryOfficeCity")} placeholder="Cidade" />
              {fieldError(form.formState.errors.registryOfficeCity?.message)}
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="registry-office-state">Estado do cartório</RequiredLabel>
              <Select id="registry-office-state" {...form.register("registryOfficeState")}>
                {brazilStateOptions.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </Select>
              {fieldError(form.formState.errors.registryOfficeState?.message)}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Estrutura do empreendimento</CardTitle>
              <CardDescription>Capacidade operacional do projeto e dados de volume.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <RequiredLabel htmlFor="total-units">Quantidade total de unidades</RequiredLabel>
                <Input id="total-units" type="number" min={1} {...form.register("totalUnits")} />
                {fieldError(form.formState.errors.totalUnits?.message)}
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="total-towers">Quantidade de torres/blocos</RequiredLabel>
                <Input id="total-towers" type="number" min={1} {...form.register("totalTowers")} />
                {fieldError(form.formState.errors.totalTowers?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="parking-spots">Quantidade de vagas de garagem</Label>
                <Input id="parking-spots" type="number" min={0} {...form.register("parkingSpots")} />
                {fieldError(form.formState.errors.parkingSpots?.message)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Status do empreendimento</CardTitle>
              <CardDescription>Defina o estágio operacional atual do empreendimento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <RequiredLabel htmlFor="development-status">Status</RequiredLabel>
              <Select id="development-status" {...form.register("status")}>
                {Object.entries(developmentRegistrationStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              {fieldError(form.formState.errors.status?.message)}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/70 pt-2 sm:flex-row sm:justify-end">
          <Link to={routes.developments} className={buttonVariants({ variant: "outline" })}>
            Cancelar
          </Link>
          <Button type="submit" disabled={createDevelopmentMutation.isPending}>
            Salvar empreendimento
          </Button>
        </div>
      </form>
    </section>
  );
}
