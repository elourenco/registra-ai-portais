import { zodResolver } from "@hookform/resolvers/zod";
import {
  formatCepInput,
  formatCnpjInput,
  formatCpfInput,
  formatCurrencyInput,
  formatPhoneInput,
  getRequiredDocumentChecklistItems,
  maritalPropertyRegimeLabels,
  maritalStatusLabels,
  normalizeDigits,
  type RequiredDocumentChecklistItem,
  requiresSpouseSection,
  type UploadedRegistrationDocument,
  type UserRegistrationDocumentStatus,
  type UserRegistrationFormInput,
  type UserRegistrationFormValues,
  userRegistrationFormSchema,
} from "@registra/shared";
import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Separator,
  Textarea,
} from "@registra/ui";
import { Check, FileUp, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";

import { PageHeader } from "@/features/registration-core/components/page-header";
import { buildSupplierWorkspaceSidebar } from "@/features/registration-core/core/workspace-sidebar";
import { useRegistrationWorkspaceQuery } from "@/features/registration-core/hooks/use-registration-workspace-query";
import { routes } from "@/shared/constants/routes";
import { useRegisterWorkspaceSidebar } from "@/shared/hooks/use-register-workspace-sidebar";

type UploadItem = UploadedRegistrationDocument & { file: File };
type SaveState = "complete" | "pending";

const stateOptions = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
];

function fieldError(message?: string) {
  return message ? <p className="text-xs text-rose-600">{message}</p> : null;
}

const developmentIdParamSchema = z.string().trim().min(1);

export function UserRegistrationPage() {
  const workspaceQuery = useRegistrationWorkspaceQuery();
  const params = useParams<{ developmentId: string }>();
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadItem[]>([]);
  const [savedSummary, setSavedSummary] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const developmentId = useMemo(() => {
    const parsed = developmentIdParamSchema.safeParse(params.developmentId);
    return parsed.success ? parsed.data : null;
  }, [params.developmentId]);

  const development = useMemo(
    () => workspaceQuery.data?.developments.find((item) => item.id === developmentId) ?? null,
    [developmentId, workspaceQuery.data?.developments],
  );
  const supplier = useMemo(
    () =>
      workspaceQuery.data?.suppliers.find((item) => item.id === development?.supplierId) ?? null,
    [development?.supplierId, workspaceQuery.data?.suppliers],
  );
  const workspaceSidebar = useMemo(() => {
    if (!development || !supplier) {
      return null;
    }

    return buildSupplierWorkspaceSidebar({
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierCnpj: supplier.cnpj,
    });
  }, [development, supplier]);

  useRegisterWorkspaceSidebar(workspaceSidebar);

  const form = useForm<UserRegistrationFormInput, undefined, UserRegistrationFormValues>({
    resolver: zodResolver(userRegistrationFormSchema),
    defaultValues: {
      registrationType: "cpf",
      maritalStatus: "single",
      documents: [],
    },
  });

  const registrationType = form.watch("registrationType");
  const maritalStatus = form.watch("maritalStatus") ?? "";
  const maritalPropertyRegime = form.watch("maritalPropertyRegime") ?? "";
  const spouseRequired = requiresSpouseSection(maritalStatus);

  const requiredDocumentChecklistItems = useMemo(
    () => getRequiredDocumentChecklistItems(registrationType, maritalStatus, maritalPropertyRegime),
    [maritalPropertyRegime, maritalStatus, registrationType],
  );

  const uploadedDocumentTypes = useMemo(
    () =>
      new Set(
        uploadedDocuments
          .filter((document) => document.status !== "pending")
          .map((document) => document.documentType),
      ),
    [uploadedDocuments],
  );

  useEffect(() => {
    form.setValue(
      "documents",
      uploadedDocuments.map(({ file: _file, ...document }) => document),
      { shouldValidate: true },
    );
  }, [form, uploadedDocuments]);

  const getUploadedDocumentForItem = (item: RequiredDocumentChecklistItem) =>
    uploadedDocuments.find((document) =>
      item.acceptedDocumentTypes.includes(document.documentType),
    );

  const handleRequiredDocumentUpload = (item: RequiredDocumentChecklistItem, file: File | null) => {
    if (!file) {
      return;
    }

    const nextDocumentType = item.acceptedDocumentTypes[0];

    setUploadedDocuments((current) => {
      const filteredDocuments = current.filter(
        (document) => !item.acceptedDocumentTypes.includes(document.documentType),
      );

      return [
        ...filteredDocuments,
        {
          id: crypto.randomUUID(),
          documentType: nextDocumentType,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          uploadedAt: new Date().toISOString(),
          status: "pending" as const,
          file,
        },
      ];
    });
  };

  const updateDocumentStatus = (documentId: string, status: UserRegistrationDocumentStatus) => {
    setUploadedDocuments((current) =>
      current.map((document) => (document.id === documentId ? { ...document, status } : document)),
    );
  };

  const removeDocument = (documentId: string) => {
    setUploadedDocuments((current) => current.filter((document) => document.id !== documentId));
  };

  const handleSubmit = form.handleSubmit(
    (values) => {
      form.clearErrors(["cpf", "cnpj"]);
      setSavedSummary(null);
      setSaveState(null);

      const buyers = workspaceQuery.data?.buyers ?? [];
      const suppliers = workspaceQuery.data?.suppliers ?? [];
      const developments = workspaceQuery.data?.developments ?? [];

      if (values.registrationType === "cpf") {
        const cpfDigits = normalizeDigits(values.cpf ?? "");
        const cpfExists = buyers.some((buyer) => normalizeDigits(buyer.cpf) === cpfDigits);

        if (cpfExists) {
          form.setError("cpf", { message: "Este CPF já está cadastrado no sistema." });
          return;
        }

        setSaveState("complete");
        setSavedSummary(
          `Cadastro de comprador pessoa física pronto para envio: ${values.fullName}.`,
        );
        return;
      }

      const cnpjDigits = normalizeDigits(values.cnpj ?? "");
      const cnpjExists =
        suppliers.some((supplier) => normalizeDigits(supplier.cnpj) === cnpjDigits) ||
        developments.some((development) => normalizeDigits(development.cnpj) === cnpjDigits);

      if (cnpjExists) {
        form.setError("cnpj", { message: "Este CNPJ já está cadastrado no sistema." });
        return;
      }

      setSaveState("complete");
      setSavedSummary(
        `Cadastro de comprador pessoa jurídica pronto para envio: ${values.companyName}.`,
      );
    },
    () => {
      setSaveState("pending");
      setSavedSummary("Cadastro salvo com informações pendentes.");
    },
  );

  if (!developmentId) {
    return (
      <Card className="border-rose-200 bg-rose-50/70">
        <CardContent className="space-y-3 p-6">
          <p className="font-medium text-rose-700">
            Empreendimento inválido para cadastro de comprador.
          </p>
          <Link to={routes.developments} className={buttonVariants({ variant: "outline" })}>
            Voltar para empreendimentos
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!workspaceQuery.isPending && !development) {
    return (
      <Card className="border-rose-200 bg-rose-50/70">
        <CardContent className="space-y-3 p-6">
          <p className="font-medium text-rose-700">
            Empreendimento não encontrado para cadastro de comprador.
          </p>
          <Link to={routes.developments} className={buttonVariants({ variant: "outline" })}>
            Voltar para empreendimentos
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Cadastro de comprador"
        description="Cadastre um comprador dentro do empreendimento, com documentos obrigatórios, estado civil e cônjuge quando aplicável."
      />

      {development ? (
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-medium">{development.name}</p>
              <p className="text-sm text-muted-foreground">
                {supplier?.name ?? "Cliente não encontrado"} · o comprador será vinculado a este
                empreendimento.
              </p>
            </div>
            <Badge variant="outline">Empreendimento vinculado</Badge>
          </CardContent>
        </Card>
      ) : null}

      {savedSummary ? (
        <Card
          className={
            saveState === "pending"
              ? "border-amber-200 bg-amber-50/80"
              : "border-emerald-200 bg-emerald-50/80"
          }
        >
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={
                  saveState === "pending"
                    ? "font-medium text-amber-700"
                    : "font-medium text-emerald-700"
                }
              >
                {savedSummary}
              </p>
              {saveState === "pending" ? (
                <Badge variant="outline" className="border-amber-200 text-amber-700">
                  Informações pendentes
                </Badge>
              ) : null}
            </div>
            <p
              className={
                saveState === "pending"
                  ? "mt-1 text-sm text-amber-700/80"
                  : "mt-1 text-sm text-emerald-700/80"
              }
            >
              {saveState === "pending"
                ? "O cadastro pode seguir como rascunho, mas ainda há campos ou documentos obrigatórios pendentes."
                : "Validações concluídas com sucesso no frontend. Integração de persistência ainda não foi conectada."}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Tipo de cadastro</CardTitle>
            <CardDescription>
              Escolha se o usuário será cadastrado como pessoa física ou jurídica. O formulário se
              adapta automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
              <input
                type="radio"
                value="cpf"
                {...form.register("registrationType")}
                className="mt-1 h-4 w-4"
              />
              <div>
                <p className="font-medium">Pessoa Física (CPF)</p>
                <p className="text-sm text-muted-foreground">
                  Cadastro do comprador pessoa física.
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
              <input
                type="radio"
                value="cnpj"
                {...form.register("registrationType")}
                className="mt-1 h-4 w-4"
              />
              <div>
                <p className="font-medium">Pessoa Jurídica (CNPJ)</p>
                <p className="text-sm text-muted-foreground">
                  Cadastro do comprador pessoa jurídica.
                </p>
              </div>
            </label>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Dados principais</CardTitle>
            <CardDescription>
              Preencha as informações obrigatórias conforme o tipo selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {registrationType === "cpf" ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="space-y-2 xl:col-span-2">
                    <Label htmlFor="full-name">Nome completo</Label>
                    <Input
                      id="full-name"
                      {...form.register("fullName")}
                      placeholder="Nome completo do comprador"
                    />
                    {fieldError(form.formState.errors.fullName?.message)}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      {...form.register("cpf")}
                      placeholder="000.000.000-00"
                      onChange={(event) =>
                        form.setValue("cpf", formatCpfInput(event.target.value), {
                          shouldValidate: true,
                        })
                      }
                    />
                    {fieldError(form.formState.errors.cpf?.message)}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="nome@exemplo.com"
                    />
                    {fieldError(form.formState.errors.email?.message)}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      {...form.register("phone")}
                      placeholder="(11) 99999-9999"
                      onChange={(event) =>
                        form.setValue("phone", formatPhoneInput(event.target.value), {
                          shouldValidate: true,
                        })
                      }
                    />
                    {fieldError(form.formState.errors.phone?.message)}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="property-value">Valor do imóvel</Label>
                    <Input
                      id="property-value"
                      {...form.register("propertyValue")}
                      placeholder="R$ 0,00"
                      inputMode="numeric"
                      onChange={(event) =>
                        form.setValue("propertyValue", formatCurrencyInput(event.target.value), {
                          shouldValidate: true,
                        })
                      }
                    />
                    {fieldError(form.formState.errors.propertyValue?.message)}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth-date">Data de nascimento</Label>
                    <Input id="birth-date" type="date" {...form.register("birthDate")} />
                    {fieldError(form.formState.errors.birthDate?.message)}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marital-status">Estado civil</Label>
                    <Select id="marital-status" {...form.register("maritalStatus")}>
                      {Object.entries(maritalStatusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                    {fieldError(form.formState.errors.maritalStatus?.message)}
                  </div>
                  {spouseRequired ? (
                    <div className="space-y-2">
                      <Label htmlFor="marital-property-regime">Regime de bens</Label>
                      <Select
                        id="marital-property-regime"
                        {...form.register("maritalPropertyRegime")}
                      >
                        <option value="">Selecione o regime</option>
                        {Object.entries(maritalPropertyRegimeLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                      {fieldError(form.formState.errors.maritalPropertyRegime?.message)}
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <Label htmlFor="profession">Profissão</Label>
                    <Input
                      id="profession"
                      {...form.register("profession")}
                      placeholder="Profissão"
                    />
                    {fieldError(form.formState.errors.profession?.message)}
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2 xl:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      {...form.register("address")}
                      placeholder="Rua, número e complemento"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      {...form.register("cep")}
                      placeholder="00000-000"
                      onChange={(event) => form.setValue("cep", formatCepInput(event.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" {...form.register("city")} placeholder="Cidade" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Select id="state" {...form.register("state")}>
                      <option value="">Selecione</option>
                      {stateOptions.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="company-name">Razão social</Label>
                  <Input
                    id="company-name"
                    {...form.register("companyName")}
                    placeholder="Razão social da empresa"
                  />
                  {fieldError(form.formState.errors.companyName?.message)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trade-name">Nome fantasia</Label>
                  <Input
                    id="trade-name"
                    {...form.register("tradeName")}
                    placeholder="Nome fantasia"
                  />
                  {fieldError(form.formState.errors.tradeName?.message)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    {...form.register("cnpj")}
                    placeholder="00.000.000/0000-00"
                    onChange={(event) =>
                      form.setValue("cnpj", formatCnpjInput(event.target.value), {
                        shouldValidate: true,
                      })
                    }
                  />
                  {fieldError(form.formState.errors.cnpj?.message)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="corporate-email">E-mail corporativo</Label>
                  <Input
                    id="corporate-email"
                    type="email"
                    {...form.register("corporateEmail")}
                    placeholder="contato@empresa.com"
                  />
                  {fieldError(form.formState.errors.corporateEmail?.message)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone-company">Telefone</Label>
                  <Input
                    id="phone-company"
                    {...form.register("phone")}
                    placeholder="(11) 3333-4444"
                    onChange={(event) =>
                      form.setValue("phone", formatPhoneInput(event.target.value), {
                        shouldValidate: true,
                      })
                    }
                  />
                  {fieldError(form.formState.errors.phone?.message)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsible-name">Responsável legal</Label>
                  <Input
                    id="responsible-name"
                    {...form.register("responsibleName")}
                    placeholder="Nome do responsável legal"
                  />
                  {fieldError(form.formState.errors.responsibleName?.message)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsible-cpf">CPF do responsável legal</Label>
                  <Input
                    id="responsible-cpf"
                    {...form.register("responsibleCpf")}
                    placeholder="000.000.000-00"
                    onChange={(event) =>
                      form.setValue("responsibleCpf", formatCpfInput(event.target.value), {
                        shouldValidate: true,
                      })
                    }
                  />
                  {fieldError(form.formState.errors.responsibleCpf?.message)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property-value-company">Valor do imóvel</Label>
                  <Input
                    id="property-value-company"
                    {...form.register("propertyValue")}
                    placeholder="R$ 0,00"
                    inputMode="numeric"
                    onChange={(event) =>
                      form.setValue("propertyValue", formatCurrencyInput(event.target.value), {
                        shouldValidate: true,
                      })
                    }
                  />
                  {fieldError(form.formState.errors.propertyValue?.message)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state-registration">Inscrição estadual</Label>
                  <Input
                    id="state-registration"
                    {...form.register("stateRegistration")}
                    placeholder="Opcional"
                  />
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="company-address">Endereço da empresa</Label>
                  <Textarea
                    id="company-address"
                    rows={3}
                    {...form.register("companyAddress")}
                    placeholder="Rua, número e complemento"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-cep">CEP</Label>
                  <Input
                    id="company-cep"
                    {...form.register("companyCep")}
                    placeholder="00000-000"
                    onChange={(event) =>
                      form.setValue("companyCep", formatCepInput(event.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-city">Cidade</Label>
                  <Input id="company-city" {...form.register("companyCity")} placeholder="Cidade" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-state">Estado</Label>
                  <Select id="company-state" {...form.register("companyState")}>
                    <option value="">Selecione</option>
                    {stateOptions.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {registrationType === "cpf" && spouseRequired ? (
          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Dados do cônjuge</CardTitle>
              <CardDescription>
                Em processos de registro imobiliário, costuma ser necessário validar a documentação
                de ambos os cônjuges.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2 xl:col-span-2">
                <Label htmlFor="spouse-name">Nome completo do cônjuge</Label>
                <Input
                  id="spouse-name"
                  {...form.register("spouseName")}
                  placeholder="Nome completo do cônjuge"
                />
                {fieldError(form.formState.errors.spouseName?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse-cpf">CPF do cônjuge</Label>
                <Input
                  id="spouse-cpf"
                  {...form.register("spouseCpf")}
                  placeholder="000.000.000-00"
                  onChange={(event) =>
                    form.setValue("spouseCpf", formatCpfInput(event.target.value), {
                      shouldValidate: true,
                    })
                  }
                />
                {fieldError(form.formState.errors.spouseCpf?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse-birth-date">Data de nascimento</Label>
                <Input id="spouse-birth-date" type="date" {...form.register("spouseBirthDate")} />
                {fieldError(form.formState.errors.spouseBirthDate?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse-email">E-mail</Label>
                <Input
                  id="spouse-email"
                  type="email"
                  {...form.register("spouseEmail")}
                  placeholder="Opcional"
                />
                {fieldError(form.formState.errors.spouseEmail?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse-phone">Telefone</Label>
                <Input
                  id="spouse-phone"
                  {...form.register("spousePhone")}
                  placeholder="Opcional"
                  onChange={(event) =>
                    form.setValue("spousePhone", formatPhoneInput(event.target.value))
                  }
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
            <CardDescription>
              Faça upload dos documentos obrigatórios em PDF, PNG, JPG ou JPEG.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-4">
              {requiredDocumentChecklistItems.map((item) => {
                const uploadedDocument = getUploadedDocumentForItem(item);
                const isCompleted = item.acceptedDocumentTypes.some((type) =>
                  uploadedDocumentTypes.has(type),
                );

                return (
                  <article key={item.key} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{item.label}</p>
                          {isCompleted ? (
                            <Badge
                              variant="outline"
                              className="gap-1.5 border-emerald-200 text-emerald-700"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Upload realizado
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pendente</Badge>
                          )}
                        </div>
                        {uploadedDocument ? (
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <FileUp className="h-4 w-4 text-primary" />
                              <span className="font-medium">{uploadedDocument.fileName}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Enviado em{" "}
                              {new Intl.DateTimeFormat("pt-BR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              }).format(new Date(uploadedDocument.uploadedAt))}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <div className="w-full max-w-xl space-y-2">
                        <Label htmlFor={`document-${item.key}`}>Arquivo</Label>
                        <input
                          ref={(element) => {
                            fileInputRefs.current[item.key] = element;
                          }}
                          id={`document-${item.key}`}
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="sr-only"
                          onChange={(event) => {
                            handleRequiredDocumentUpload(item, event.target.files?.[0] ?? null);
                            event.target.value = "";
                          }}
                        />
                        <div className="flex gap-3">
                          <Input
                            value={uploadedDocument?.fileName ?? ""}
                            readOnly
                            placeholder="Nenhum arquivo selecionado"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRefs.current[item.key]?.click()}
                          >
                            {uploadedDocument ? "Trocar arquivo" : "Escolher arquivo"}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {uploadedDocument ? (
                            <>
                              {uploadedDocument.status === "pending" ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateDocumentStatus(uploadedDocument.id, "sent")}
                                >
                                  <UploadCloud className="mr-2 h-4 w-4" />
                                  Adicionar
                                </Button>
                              ) : null}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeDocument(uploadedDocument.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {registrationType === "cpf" && maritalPropertyRegime === "total_separation" ? (
              <p className="text-xs text-muted-foreground">
                Para separação total de bens, envie a escritura de pacto antenupcial e o registro no
                cartório competente.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg">
            Salvar cadastro
          </Button>
        </div>
      </form>
    </section>
  );
}
