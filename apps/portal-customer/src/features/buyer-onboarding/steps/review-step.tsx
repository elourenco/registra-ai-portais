import { Badge, Button, Card, CardContent, Checkbox, Separator } from "@registra/ui";
import { formatCnpjInput } from "@registra/shared";

import type {
  BuyerIdentifierType,
  BuyerDocument,
  PersonalData,
  PropertyConfirmation,
  SpouseData,
} from "../buyer-onboarding.types";
import { StepLayout } from "../components/step-layout";

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

  return (
    <StepLayout
      title="Revise antes de enviar"
      description="Confirme os dados preenchidos e envie sua jornada para análise."
      currentStep={currentStep}
      totalSteps={totalSteps}
      primaryActionLabel="Enviar para análise"
      primaryLoading={isSubmitting}
      primaryDisabled={!isValidated}
      onPrimaryAction={onSubmit}
      onBackAction={onBack}
    >
      <Card className="border-border/70 bg-muted/20 shadow-none">
        <CardContent className="space-y-3 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Cadastro no e-Notariado</p>
            <p className="text-sm text-muted-foreground">
              Antes de enviar para análise, confirme se o seu cadastro no e-Notariado já foi realizado.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.open(eNotariadoRegistrationUrl, "_blank", "noopener,noreferrer")}
          >
            Abrir cadastro oficial
          </Button>
          <label className="flex items-start gap-3 rounded-lg border border-border/70 bg-background px-3 py-3">
            <Checkbox
              checked={eNotariadoConfirmed}
              onCheckedChange={(checked) => onToggleENotariado(Boolean(checked))}
            />
            <span className="text-sm text-foreground">Já tenho cadastro no e-Notariado</span>
          </label>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-muted/20 shadow-none">
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Empreendimento</p>
            <p className="text-sm text-muted-foreground">
              {property.name} · {formatCnpjInput(property.cnpj)} · {property.unitLabel} · {property.acquisitionType} · {property.purchaseValue}
            </p>
            <p className="text-sm text-muted-foreground">
              {property.address}
            </p>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {isCompanyFlow ? "Dados da empresa" : "Dados pessoais"}
            </p>
            <p className="text-sm text-muted-foreground">
              {personalData.fullName} · {personalData.email} · {personalData.phone}
            </p>
          </div>
          {spouseData ? (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Cônjuge</p>
                <p className="text-sm text-muted-foreground">
                  {spouseData.fullName} · {spouseData.email} · {spouseData.phone}
                </p>
              </div>
            </>
          ) : null}
          <Separator />
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Documentos</p>
            <div className="space-y-2">
              {documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{document.title}</span>
                  <Badge
                    variant={
                      document.status === "approved"
                        ? "success"
                        : document.status === "uploaded"
                          ? "secondary"
                          : document.status === "rejected"
                            ? "danger"
                            : "outline"
                    }
                  >
                    {document.status === "approved"
                      ? "Aprovado"
                      : document.status === "uploaded"
                        ? "Anexado"
                        : document.status === "rejected"
                          ? "Rejeitado"
                          : "Pendente"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </StepLayout>
  );
}
