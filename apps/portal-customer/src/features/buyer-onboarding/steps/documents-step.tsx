import { Badge } from "@registra/ui";

import type { BuyerDocument, BuyerIdentifierType } from "../buyer-onboarding.types";
import { DocumentCard } from "../components/document-card";
import { StepLayout } from "../components/step-layout";

interface DocumentsStepProps {
  documents: BuyerDocument[];
  identifierType: BuyerIdentifierType;
  currentStep: number;
  totalSteps: number;
  onUpload: (documentId: string, file: File) => void;
  onRemove: (documentId: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function DocumentsStep({
  documents,
  identifierType,
  currentStep,
  totalSteps,
  onUpload,
  onRemove,
  onContinue,
  onBack,
}: DocumentsStepProps) {
  const pendingCount = documents.filter((item) => item.status === "pending" || item.status === "rejected").length;
  const isCompanyFlow = identifierType === "cnpj";

  return (
    <StepLayout
      title="Documentos"
      description={
        isCompanyFlow
          ? "Envie apenas os documentos da empresa e do representante legal. O restante fica oculto automaticamente."
          : "Envie apenas os documentos pedidos para o seu cenário. O restante fica oculto automaticamente."
      }
      currentStep={currentStep}
      totalSteps={totalSteps}
      primaryActionLabel="Continuar"
      onPrimaryAction={onContinue}
      primaryDisabled={pendingCount > 0}
      onBackAction={onBack}
      footerHint={pendingCount > 0 ? `Faltam ${pendingCount} documento(s).` : "Todos os documentos necessários foram enviados."}
    >
      <div className="flex items-center gap-2">
        <Badge variant={pendingCount > 0 ? "warning" : "success"}>
          {pendingCount > 0 ? "Aguardando envio" : "Documentos completos"}
        </Badge>
        <p className="text-sm text-muted-foreground">
          {isCompanyFlow
            ? "O checklist varia conforme o tipo de acesso por CNPJ."
            : "O checklist varia conforme seu estado civil."}
        </p>
      </div>

      <div className="space-y-4">
        {documents.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onUpload={(file) => onUpload(document.id, file)}
            onRemove={() => onRemove(document.id)}
          />
        ))}
      </div>
    </StepLayout>
  );
}
