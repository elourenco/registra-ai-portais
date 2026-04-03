import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@registra/ui";
import { formatCnpjInput } from "@registra/shared";

import type {
  BuyerIdentifierType,
  BuyerDocument,
  PersonalData,
  PropertyConfirmation,
  SpouseData,
} from "../buyer-onboarding.types";
import { ProgressHeader } from "../components/progress-header";

interface ReviewStepProps {
  property: PropertyConfirmation;
  personalData: PersonalData;
  identifierType: BuyerIdentifierType;
  spouseData: SpouseData | null;
  documents: BuyerDocument[];
  eNotariadoConfirmed: boolean;
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  isValidated: boolean;
  onToggleENotariado: (checked: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
}

function displayValue(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : "Não informado";
}

function documentStatusPresentation(status: BuyerDocument["status"]) {
  switch (status) {
    case "approved":
      return { label: "Aprovado", className: "", variant: "success" as const };
    case "uploaded":
      return {
        label: "Enviado",
        className: "border-sky-200 bg-sky-100 text-sky-700 transition-colors",
        variant: "outline" as const,
      };
    case "rejected":
      return { label: "Rejeitado", className: "", variant: "danger" as const };
    default:
      return { label: "Pendente", className: "transition-colors", variant: "outline" as const };
  }
}

export function ReviewStep({
  property,
  personalData,
  identifierType,
  spouseData,
  documents,
  eNotariadoConfirmed,
  currentStep,
  totalSteps,
  isSubmitting,
  isValidated,
  onToggleENotariado,
  onSubmit,
  onBack,
}: ReviewStepProps) {
  const eNotariadoRegistrationUrl = "https://cadastro.e-notariado.org.br/menu-cnb-online?r=cadastro";
  const isCompanyFlow = identifierType === "cnpj";
  const hasSpouseDetails = Boolean(spouseData?.fullName || spouseData?.email);
  const isSubmitBlockedByEnotariado = eNotariadoConfirmed !== true;
  const isSubmitDisabled = isSubmitBlockedByEnotariado || !isValidated || isSubmitting;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <ProgressHeader
          title="Finalize seu envio"
          description="Revise as informações abaixo antes de enviar seu processo para análise."
          currentStep={currentStep}
          totalSteps={totalSteps}
        />

        <Card
          className={
            eNotariadoConfirmed
              ? "border-emerald-200 bg-card shadow-sm transition-colors"
              : "border-border shadow-sm transition-colors"
          }
        >
          <CardHeader className="gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg">Cadastro no e-Notariado</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Validação de identidade e assinatura digital do imóvel.
                </p>
              </div>
              {eNotariadoConfirmed ? <Badge variant="success">Confirmado</Badge> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {eNotariadoConfirmed
                ? "Cadastro confirmado. Você pode continuar."
                : "Para finalizar o registro do imóvel, é necessário possuir cadastro ativo no e-Notariado."}
            </p>

            {!eNotariadoConfirmed ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  onClick={() =>
                    window.open(eNotariadoRegistrationUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  Criar ou acessar cadastro
                </Button>
              </div>
            ) : null}

            <div className="flex items-start gap-3 rounded-md border border-border p-3">
              <Checkbox
                id="enotariado-confirmed"
                checked={eNotariadoConfirmed}
                onCheckedChange={(checked) => onToggleENotariado(Boolean(checked))}
              />
              <Label
                htmlFor="enotariado-confirmed"
                className="text-sm font-medium leading-5 text-foreground"
              >
                Já possuo cadastro no e-Notariado
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Resumo das informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Dados do imóvel</h2>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-medium text-foreground">Nome</p>
                  <p className="text-muted-foreground">{displayValue(property.name)}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">CNPJ</p>
                  <p className="text-muted-foreground">
                    {property.cnpj ? formatCnpjInput(property.cnpj) : "Não informado"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Unidade</p>
                  <p className="text-muted-foreground">{displayValue(property.unitLabel)}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Forma de aquisição</p>
                  <p className="text-muted-foreground">{displayValue(property.acquisitionType)}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Valor</p>
                  <p className="text-muted-foreground">{displayValue(property.purchaseValue)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-medium text-foreground">Endereço</p>
                  <p className="text-muted-foreground">{displayValue(property.address)}</p>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Informações pessoais</h2>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-medium text-foreground">Nome</p>
                  <p className="text-muted-foreground">{displayValue(personalData.fullName)}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p className="text-muted-foreground">{displayValue(personalData.email)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-medium text-foreground">Telefone</p>
                  <p className="text-muted-foreground">{displayValue(personalData.phone)}</p>
                </div>
              </div>
            </section>

            {!isCompanyFlow && spouseData && hasSpouseDetails ? (
              <>
                <Separator />
                <section className="space-y-3">
                  <h2 className="text-base font-semibold text-foreground">Cônjuge</h2>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="font-medium text-foreground">Nome</p>
                      <p className="text-muted-foreground">{displayValue(spouseData.fullName)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <p className="text-muted-foreground">{displayValue(spouseData.email)}</p>
                    </div>
                  </div>
                </section>
              </>
            ) : null}

            <Separator />

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Documentos enviados</h2>
              <div className="space-y-2">
                {documents.map((document) => {
                  const status = documentStatusPresentation(document.status);

                  return (
                    <div
                      key={document.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-4 py-3 text-sm"
                    >
                      <span className="text-foreground">{document.title}</span>
                      <Badge variant={status.variant} className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </section>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onBack}>
            Voltar
          </Button>

          {isSubmitBlockedByEnotariado ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    type="button"
                    disabled
                    className="transition-all duration-200 ease-out"
                  >
                    Enviar para análise
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Confirme seu cadastro no e-Notariado para continuar
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitDisabled}
              className="transition-all duration-200 ease-out"
            >
              {isSubmitting ? "Carregando..." : "Enviar para análise"}
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
