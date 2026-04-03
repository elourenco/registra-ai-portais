import type { BuyerDocument } from "../buyer-onboarding.types";
import { DocumentCard } from "../components/document-card";
import { StepLayout } from "../components/step-layout";

interface DocumentsStepProps {
  documents: BuyerDocument[];
  currentStep: number;
  totalSteps: number;
  isValidated: boolean;
  onUpload: (documentId: string, file: File) => void;
  onRemove: (documentId: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function DocumentsStep({
  documents,
  currentStep,
  totalSteps,
  isValidated,
  onUpload,
  onRemove,
  onContinue,
  onBack,
}: DocumentsStepProps) {
  const pendingCount = documents.filter(
    (item) => item.status === "pending" || item.status === "rejected",
  ).length;
  const footerHint =
    pendingCount > 0
      ? `Faltam ${pendingCount} documento(s).`
      : "Todos os documentos necessários foram enviados.";

  return (
    <StepLayout
      title="Envio de documentos"
      description="Os documentos exigidos abaixo variam conforme o estado civil selecionado e precisam ser enviados para continuar."
      cardTitle="Documentos necessários"
      currentStep={currentStep}
      totalSteps={totalSteps}
      primaryActionLabel="Continuar"
      onPrimaryAction={onContinue}
      primaryDisabled={!isValidated}
      onBackAction={onBack}
      footerHint={footerHint}
    >
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
