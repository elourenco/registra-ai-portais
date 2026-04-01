import { formatCnpjInput, formatCpfInput, formatPhoneInput } from "@registra/shared";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  useToast,
} from "@registra/ui";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { BuyerProcessSnapshot } from "@registra/shared";

import type {
  BuyerAccessData,
  BuyerIdentifierType,
  BuyerDocument,
  MaritalStatusOption,
  OnboardingState,
  TimelineStage,
  TrackerStatus,
} from "./buyer-onboarding.types";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { StatusTracker } from "./components/status-tracker";
import {
  isDocumentsStepComplete,
  isReviewStepComplete,
  resolveOnboardingStep,
} from "./core/buyer-onboarding-validation";
import { useBuyerProcessQuery } from "./hooks/use-buyer-process-query";
import { DocumentsStep } from "./steps/documents-step";
import { EmpreendimentoStep } from "./steps/empreendimento-step";
import { LoginStep } from "./steps/login-step";
import { MaritalStep } from "./steps/marital-step";
import { PersonalStep } from "./steps/personal-step";
import { ReviewStep } from "./steps/review-step";
import { SpouseStep } from "./steps/spouse-step";

const STORAGE_KEY = "registra-ai.customer.onboarding-state";

type OnboardingPageProps = {
  includeLoginStep?: boolean;
  initialStep?: OnboardingState["step"];
  persistProgress?: boolean;
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function buildPersonalData(identifierType: BuyerIdentifierType, documentNumber: string) {
  if (identifierType === "cnpj") {
    return {
      fullName: "Aurora Incorporadora SPE Ltda.",
      cpf: documentNumber,
      birthDate: "",
      nationality: "Sociedade empresária limitada",
      profession: "",
      email: "contato@auroraspe.com.br",
      phone: "",
    };
  }

  return {
    fullName: "Marina Duarte",
    cpf: documentNumber,
    birthDate: "",
    nationality: "Brasileira",
    profession: "",
    email: "marina@exemplo.com",
    phone: "",
  };
}

function buildEmptySpouseData() {
  return {
    fullName: "",
    cpf: "",
    birthDate: "",
    email: "",
    phone: "",
  };
}

function buildDocuments(
  identifierType: BuyerIdentifierType,
  maritalStatus: MaritalStatusOption,
): BuyerDocument[] {
  if (identifierType === "cnpj") {
    return [
      {
        id: "company-contract",
        title: "Contrato social ou última alteração consolidada",
        owner: "buyer",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
      },
      {
        id: "company-card",
        title: "Cartão do CNPJ",
        owner: "buyer",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
      },
      {
        id: "company-address",
        title: "Comprovante de endereço da empresa",
        owner: "buyer",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
      },
      {
        id: "company-representative-id",
        title: "RG ou CNH do representante legal",
        owner: "buyer",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
      },
    ];
  }

  if (maritalStatus === "single") {
    return [
      {
        id: "buyer-id",
        title: "RG ou CNH",
        owner: "buyer",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
      },
      {
        id: "buyer-address",
        title: "Comprovante de residência",
        owner: "buyer",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
      },
      {
        id: "buyer-birth-certificate",
        title: "Certidão de nascimento",
        owner: "buyer",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
      },
    ];
  }

  if (maritalStatus === "married") {
    return [
      {
        id: "buyer-id",
        title: "RG ou CNH",
        owner: "buyer",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
      },
      {
        id: "buyer-address",
        title: "Comprovante de residência",
        owner: "buyer",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
      },
      {
        id: "buyer-marriage-certificate",
        title: "Certidão de casamento",
        owner: "buyer",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
      },
      {
        id: "spouse-id",
        title: "RG ou CNH do cônjuge",
        owner: "spouse",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
      },
    ];
  }

  return [
    {
      id: "buyer-id",
      title: "RG ou CNH",
        owner: "buyer",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
    },
    {
      id: "buyer-address",
      title: "Comprovante de residência",
        owner: "buyer",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
    },
    {
      id: "buyer-marriage-certificate",
      title: "Certidão de casamento",
        owner: "buyer",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
    },
    {
      id: "spouse-id",
      title: "RG ou CNH do cônjuge",
        owner: "spouse",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
    },
    {
      id: "spouse-cpf",
      title: "CPF do cônjuge",
        owner: "spouse",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
    },
    {
      id: "spouse-certificate",
      title: "Certidão do cônjuge",
        owner: "spouse",
        status: "pending",
        fileName: null,
        fileType: null,
        fileSizeKb: null,
        previewUrl: null,
        rejectionReason: null,
    },
  ];
}

function mergeDocuments(
  currentDocuments: BuyerDocument[],
  identifierType: BuyerIdentifierType,
  maritalStatus: MaritalStatusOption,
): BuyerDocument[] {
  const baseDocuments = buildDocuments(identifierType, maritalStatus);

  return baseDocuments.map((baseDocument) => {
    const existingDocument = currentDocuments.find((item) => item.id === baseDocument.id);
    return existingDocument ? { ...baseDocument, ...existingDocument } : baseDocument;
  });
}

function buildTimeline(status: TrackerStatus): TimelineStage[] {
  if (status === "completed") {
    return [
      { id: "certificate", title: "Certificado", status: "completed", description: "Documentos iniciais validados." },
      { id: "contract", title: "Contrato", status: "completed", description: "Contrato assinado e confirmado." },
      { id: "registry", title: "Registro", status: "completed", description: "Registro final concluído." },
    ];
  }

  if (status === "waiting_user") {
    return [
      { id: "certificate", title: "Certificado", status: "in_progress", description: "Há um documento aguardando seu envio." },
      { id: "contract", title: "Contrato", status: "pending", description: "Será iniciado após a validação do certificado." },
      { id: "registry", title: "Registro", status: "pending", description: "Última etapa do processo." },
    ];
  }

  return [
    { id: "certificate", title: "Certificado", status: "completed", description: "Dados validados e cadastro confirmado." },
    { id: "contract", title: "Contrato", status: "in_progress", description: "Equipe conferindo documentos e contrato." },
    { id: "registry", title: "Registro", status: "pending", description: "Será iniciado após a assinatura do contrato." },
  ];
}

function normalizeAccessData(access?: Partial<BuyerAccessData> & { cpf?: string }): BuyerAccessData {
  return {
    identifierType: access?.identifierType ?? "cpf",
    documentNumber: access?.documentNumber ?? access?.cpf ?? "123.456.789-01",
    accessCode: access?.accessCode ?? "",
  };
}

function buildInitialState(
  initialStep: OnboardingState["step"] = "login",
  includeLoginStep = true,
  snapshot?: BuyerProcessSnapshot | null,
): OnboardingState {
  if (snapshot) {
    const documentNumber =
      snapshot.identifierType === "cnpj"
        ? formatCnpjInput(snapshot.personalData.documentNumber)
        : formatCpfInput(snapshot.personalData.documentNumber);
    const access = normalizeAccessData({
      identifierType: snapshot.identifierType,
      documentNumber,
      accessCode: "",
    });

    const timeline: TimelineStage[] = snapshot.timeline.map((stage, index) => ({
      id:
        stage.id === "certificate" || stage.id === "contract" || stage.id === "registry"
          ? stage.id
          : index === 0
            ? "certificate"
            : index === 1
              ? "contract"
              : "registry",
      title: stage.title,
      status: stage.status,
      description: stage.description,
    }));

    const initialState: OnboardingState = {
      step: initialStep,
      access,
      property: snapshot.property,
      isPropertyConfirmed: true,
      personalData: {
        fullName: snapshot.personalData.fullName,
        cpf: documentNumber,
        birthDate: snapshot.personalData.birthDate ?? "",
        nationality: snapshot.personalData.nationality ?? "",
        profession: snapshot.personalData.profession ?? "",
        email: snapshot.personalData.email ?? "",
        phone: formatPhoneInput(snapshot.personalData.phone ?? ""),
      },
      maritalStatus: snapshot.maritalStatus,
      spouseData: snapshot.spouseData
        ? {
            fullName: snapshot.spouseData.fullName,
            cpf: formatCpfInput(snapshot.spouseData.documentNumber),
            birthDate: snapshot.spouseData.birthDate ?? "",
            email: snapshot.spouseData.email ?? "",
            phone: formatPhoneInput(snapshot.spouseData.phone ?? ""),
          }
        : buildEmptySpouseData(),
      hasSpouse: snapshot.hasSpouse,
      eNotariadoConfirmed: false,
      documents: snapshot.documents,
      submittedAt: snapshot.submittedAt,
      trackerStatus: snapshot.trackerStatus,
      timeline,
    };

    return {
      ...initialState,
      step: resolveOnboardingStep(initialState, includeLoginStep),
    };
  }

  const access = normalizeAccessData();
  const maritalStatus: MaritalStatusOption = "single";

  return {
    step: initialStep,
    access,
    property: {
      name: "Residencial Aurora",
      cnpj: "12.345.678/0001-90",
      address: "Avenida das Palmeiras, 1200 • Centro • São Paulo - SP • 01311-000",
      unitLabel: "Torre B · Apto 1203",
      acquisitionType: "Financiamento",
      purchaseValue: "R$ 850.000,00",
    },
    isPropertyConfirmed: false,
    personalData: buildPersonalData(access.identifierType, access.documentNumber),
    maritalStatus,
    spouseData: buildEmptySpouseData(),
    hasSpouse: false,
    eNotariadoConfirmed: false,
    documents: buildDocuments(access.identifierType, maritalStatus),
    submittedAt: null,
    trackerStatus: "in_progress",
    timeline: buildTimeline("in_progress"),
  };
}

function loadInitialState(
  initialStep: OnboardingState["step"] = "login",
  includeLoginStep = true,
  snapshot?: BuyerProcessSnapshot | null,
): OnboardingState {
  if (typeof window === "undefined") {
    return buildInitialState(initialStep, includeLoginStep, snapshot);
  }

  const rawState = window.localStorage.getItem(STORAGE_KEY);
  if (!rawState) {
    return buildInitialState(initialStep, includeLoginStep, snapshot);
  }

  try {
    const parsedState = JSON.parse(rawState) as OnboardingState;
    return {
      ...buildInitialState(initialStep, includeLoginStep, snapshot),
      ...parsedState,
      access: normalizeAccessData(parsedState.access),
      personalData: {
        ...buildPersonalData(
          normalizeAccessData(parsedState.access).identifierType,
          normalizeAccessData(parsedState.access).documentNumber,
        ),
        ...parsedState.personalData,
        cpf: parsedState.personalData?.cpf ?? normalizeAccessData(parsedState.access).documentNumber,
      },
      documents: mergeDocuments(
        parsedState.documents ?? [],
        normalizeAccessData(parsedState.access).identifierType,
        parsedState.maritalStatus ?? "single",
      ),
      timeline: buildTimeline(parsedState.trackerStatus ?? "in_progress"),
    };
  } catch {
    return buildInitialState(initialStep, includeLoginStep, snapshot);
  }
}

export function OnboardingPage({
  includeLoginStep = true,
  initialStep = "login",
  persistProgress = true,
}: OnboardingPageProps = {}) {
  const { toast } = useToast();
  const buyerProcessQuery = useBuyerProcessQuery();
  const [state, setState] = useState<OnboardingState>(() =>
    persistProgress
      ? loadInitialState(initialStep, includeLoginStep)
      : buildInitialState(initialStep, includeLoginStep),
  );
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!buyerProcessQuery.data) {
      return;
    }

    setState(buildInitialState(initialStep, includeLoginStep, buyerProcessQuery.data));
  }, [buyerProcessQuery.data, includeLoginStep, initialStep]);

  useEffect(() => {
    if (!persistProgress) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [persistProgress, state]);

  const isCompanyFlow = state.access.identifierType === "cnpj";

  const visibleSteps = useMemo(() => {
    const steps: OnboardingState["step"][] = includeLoginStep
      ? ["login", "property", "personal"]
      : ["property", "personal"];

    if (!isCompanyFlow) {
      steps.push("marital");
    }

    // Keep progress stable while the user is still deciding marital status.
    const shouldIncludeSpouseStep = !isCompanyFlow && state.hasSpouse && state.step !== "marital";

    if (shouldIncludeSpouseStep) {
      steps.push("spouse");
    }
    steps.push("documents", "review");
    return steps;
  }, [includeLoginStep, isCompanyFlow, state.hasSpouse, state.step]);

  const currentStepNumber = useMemo(() => {
    const stepIndex = visibleSteps.indexOf(state.step);
    return stepIndex >= 0 ? stepIndex + 1 : visibleSteps.length;
  }, [state.step, visibleSteps]);

  const nextRequiredStep = useMemo(
    () => resolveOnboardingStep(state, includeLoginStep),
    [includeLoginStep, state],
  );
  const areDocumentsValidated = useMemo(() => isDocumentsStepComplete(state), [state]);
  const isReviewValidated = useMemo(() => isReviewStepComplete(state), [state]);

  useEffect(() => {
    if (state.step === "tracker") {
      return;
    }

    const currentIndex = visibleSteps.indexOf(state.step);
    const requiredIndex = visibleSteps.indexOf(nextRequiredStep);

    if (
      currentIndex >= 0 &&
      requiredIndex >= 0 &&
      currentIndex > requiredIndex &&
      state.step !== nextRequiredStep
    ) {
      setState((currentState) =>
        currentState.step === nextRequiredStep
          ? currentState
          : { ...currentState, step: nextRequiredStep },
      );
    }
  }, [nextRequiredStep, state.step, visibleSteps]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      await wait(500);
    },
    onSuccess: () => {
      setState((currentState) => ({ ...currentState, step: "property" }));
      toast({
        title: "Acesso validado",
        description: "Sua jornada de onboarding foi iniciada.",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await wait(700);
    },
    onSuccess: () => {
      setState((currentState) => ({
        ...currentState,
        step: "tracker",
        submittedAt: new Date().toISOString(),
        trackerStatus: currentState.documents.some((item) => item.status === "rejected")
          ? "waiting_user"
          : "in_review",
        timeline: buildTimeline(
          currentState.documents.some((item) => item.status === "rejected")
            ? "waiting_user"
            : "in_review",
        ),
      }));
      toast({
        title: "Enviado para análise",
        description: "Agora você pode acompanhar o processo em tempo real.",
      });
    },
  });

  const updateState = (updater: (currentState: OnboardingState) => OnboardingState) => {
    setState((currentState) => updater(currentState));
  };

  const updateMaritalStatus = (maritalStatus: MaritalStatusOption) => {
    updateState((currentState) => ({
      ...currentState,
      maritalStatus,
      hasSpouse: maritalStatus !== "single",
      spouseData: maritalStatus === "single" ? buildEmptySpouseData() : currentState.spouseData,
      documents: mergeDocuments(
        currentState.documents,
        currentState.access.identifierType,
        maritalStatus,
      ),
    }));
  };

  const handleDocumentUpload = (documentId: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);

    updateState((currentState) => ({
      ...currentState,
      documents: currentState.documents.map((document) =>
        document.id === documentId
          ? {
              ...document,
              status: "uploaded",
              fileName: file.name,
              fileType: file.type || file.name.split(".").pop()?.toUpperCase() || "Arquivo",
              fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
              previewUrl,
              rejectionReason: null,
            }
          : document,
      ),
    }));

    toast({
      title: "Documento enviado",
      description: `${file.name} foi salvo automaticamente.`,
    });
  };

  const handleDocumentRemove = (documentId: string) => {
    updateState((currentState) => ({
      ...currentState,
      documents: currentState.documents.map((document) =>
        document.id === documentId
          ? {
              ...document,
              status: "pending",
              fileName: null,
              fileType: null,
              fileSizeKb: null,
              previewUrl: null,
              rejectionReason: null,
            }
          : document,
      ),
    }));

    toast({
      title: "Arquivo removido",
      description: "O documento voltou para o estado pendente.",
    });
  };

  const pendingAction = useMemo(
    () => state.documents.some((document) => document.status === "rejected"),
    [state.documents],
  );

  if (isBooting || buyerProcessQuery.isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-0 py-10 sm:px-6">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-[420px] rounded-2xl" />
      </div>
    );
  }

  if (buyerProcessQuery.isError) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-0 py-10 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Não foi possível carregar seu processo</CardTitle>
            <CardDescription>
              {getApiErrorMessage(
                buyerProcessQuery.error,
                "Tente novamente em alguns segundos.",
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!buyerProcessQuery.data && !includeLoginStep) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-0 py-10 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Nenhum processo encontrado</CardTitle>
            <CardDescription>
              Não encontramos um processo ativo vinculado ao seu acesso.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-0 py-10 sm:px-6">
      {state.step === "login" ? (
        <LoginStep
          value={state.access}
          currentStep={currentStepNumber}
          totalSteps={visibleSteps.length}
          isLoading={loginMutation.isPending}
          onChange={(access) => updateState((currentState) => ({ ...currentState, access }))}
          onContinue={(access) => {
            updateState((currentState) => ({
              ...currentState,
              access,
              maritalStatus: access.identifierType === "cnpj" ? "single" : currentState.maritalStatus,
              hasSpouse: access.identifierType === "cnpj" ? false : currentState.hasSpouse,
              personalData: {
                ...buildPersonalData(access.identifierType, access.documentNumber),
                ...currentState.personalData,
                cpf: access.documentNumber,
              },
              spouseData:
                access.identifierType === "cnpj"
                  ? {
                      fullName: "",
                      cpf: "",
                      birthDate: "",
                      email: "",
                      phone: "",
                    }
                  : currentState.spouseData,
              documents: mergeDocuments(
                currentState.documents,
                access.identifierType,
                access.identifierType === "cnpj" ? "single" : currentState.maritalStatus,
              ),
            }));
            loginMutation.mutate();
          }}
        />
      ) : null}

      {state.step === "property" ? (
        <EmpreendimentoStep
          value={state.property}
          currentStep={currentStepNumber}
          totalSteps={visibleSteps.length}
          onBack={
            includeLoginStep
              ? () => updateState((currentState) => ({ ...currentState, step: "login" }))
              : undefined
          }
          onConfirm={() =>
            updateState((currentState) => ({
              ...currentState,
              isPropertyConfirmed: true,
              step: resolveOnboardingStep(
                { ...currentState, isPropertyConfirmed: true },
                includeLoginStep,
              ),
            }))
          }
        />
      ) : null}

      {state.step === "personal" ? (
        <PersonalStep
          value={state.personalData}
          identifierType={state.access.identifierType}
          currentStep={currentStepNumber}
          totalSteps={visibleSteps.length}
          onBack={() => updateState((currentState) => ({ ...currentState, step: "property" }))}
          onChange={(personalData) => updateState((currentState) => ({ ...currentState, personalData }))}
          onContinue={(personalData) =>
            updateState((currentState) => ({
              ...currentState,
              personalData,
              step: currentState.access.identifierType === "cnpj" ? "documents" : "marital",
            }))
          }
        />
      ) : null}

      {state.step === "marital" && !isCompanyFlow ? (
        <MaritalStep
          value={state.maritalStatus}
          currentStep={currentStepNumber}
          totalSteps={visibleSteps.length}
          onBack={() => updateState((currentState) => ({ ...currentState, step: "personal" }))}
          onChange={updateMaritalStatus}
          onContinue={() =>
            updateState((currentState) => ({
              ...currentState,
              step: currentState.maritalStatus === "single" ? "documents" : "spouse",
            }))
          }
        />
      ) : null}

      {state.step === "spouse" && state.hasSpouse ? (
        <SpouseStep
          value={state.spouseData}
          currentStep={currentStepNumber}
          totalSteps={visibleSteps.length}
          onBack={() => updateState((currentState) => ({ ...currentState, step: "marital" }))}
          onChange={(spouseData) => updateState((currentState) => ({ ...currentState, spouseData }))}
          onContinue={(spouseData) =>
            updateState((currentState) => ({
              ...currentState,
              spouseData,
              step: "documents",
            }))
          }
        />
      ) : null}

      {state.step === "documents" ? (
        <DocumentsStep
          documents={state.documents}
          identifierType={state.access.identifierType}
          currentStep={currentStepNumber}
          totalSteps={visibleSteps.length}
          onBack={() =>
            updateState((currentState) => ({
              ...currentState,
              step: isCompanyFlow ? "personal" : currentState.hasSpouse ? "spouse" : "marital",
            }))
          }
          onUpload={handleDocumentUpload}
          onRemove={handleDocumentRemove}
          onContinue={() =>
            updateState((currentState) => ({
              ...currentState,
              step: resolveOnboardingStep(currentState, includeLoginStep),
            }))
          }
          isValidated={areDocumentsValidated}
        />
      ) : null}

      {state.step === "review" ? (
        <ReviewStep
          property={state.property}
          personalData={state.personalData}
          identifierType={state.access.identifierType}
          spouseData={state.hasSpouse ? state.spouseData : null}
          documents={state.documents}
          eNotariadoConfirmed={state.eNotariadoConfirmed}
          currentStep={currentStepNumber}
          totalSteps={visibleSteps.length}
          isSubmitting={submitMutation.isPending}
          onToggleENotariado={(checked) =>
            updateState((currentState) => ({
              ...currentState,
              eNotariadoConfirmed: checked,
            }))
          }
          onBack={() => updateState((currentState) => ({ ...currentState, step: "documents" }))}
          onSubmit={() => submitMutation.mutate()}
          isValidated={isReviewValidated}
        />
      ) : null}

      {state.step === "tracker" ? (
        <StatusTracker
          status={state.trackerStatus}
          timeline={state.timeline}
          pendingAction={pendingAction}
          onResolveNow={() =>
            updateState((currentState) => ({
              ...currentState,
              step: "documents",
              trackerStatus: "waiting_user",
              timeline: buildTimeline("waiting_user"),
            }))
          }
        />
      ) : null}
    </div>
  );
}
