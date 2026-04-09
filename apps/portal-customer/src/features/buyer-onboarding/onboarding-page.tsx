import type { BuyerProcessSnapshot } from "@registra/shared";
import { formatCnpjInput, formatCpfInput, formatPhoneInput } from "@registra/shared";
import { Card, CardDescription, CardHeader, CardTitle, Skeleton, useToast } from "@registra/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/auth-provider";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { routes } from "@/shared/constants/routes";
import { BuyerProcessTracker } from "../buyer-process-tracker/buyer-process-tracker";
import { updateBuyer, uploadBuyerDocument } from "./api/buyer-process-api";
import type {
  BuyerAccessData,
  BuyerDocument,
  BuyerIdentifierType,
  MaritalStatusOption,
  MaritalStatusValue,
  OnboardingState,
  TimelineStage,
  TrackerStatus,
} from "./buyer-onboarding.types";
import { SubmitStatusDialog } from "./components/submit-status-dialog";
import {
  isDocumentsStepComplete,
  isReviewStepComplete,
  resolveOnboardingStep,
} from "./core/buyer-onboarding-validation";
import { getBuyerProcessQueryKey, useBuyerProcessQuery } from "./hooks/use-buyer-process-query";
import { DocumentsStep } from "./steps/documents-step";
import { EmpreendimentoStep } from "./steps/empreendimento-step";
import { LoginStep } from "./steps/login-step";
import { MaritalStep } from "./steps/marital-step";
import { PersonalStep } from "./steps/personal-step";
import { ReviewStep } from "./steps/review-step";

const STORAGE_KEY = "registra-ai.customer.onboarding-state";

type OnboardingPageProps = {
  includeLoginStep?: boolean;
  initialStep?: OnboardingState["step"];
  persistProgress?: boolean;
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseProcessId(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

const documentUploadConfig: Record<string, { block: string; type: string }> = {
  "company-contract": { block: "buyer", type: "Contrato social ou última alteração consolidada" },
  "company-card": { block: "buyer", type: "Cartão do CNPJ" },
  "company-address": { block: "buyer", type: "Comprovante de endereço da empresa" },
  "company-representative-id": { block: "buyer", type: "RG ou CNH do representante legal" },
  "buyer-id": { block: "buyer", type: "RG ou CNH" },
  "buyer-address": { block: "buyer", type: "Comprovante de residência" },
  "buyer-birth-certificate": { block: "buyer", type: "Certidão de nascimento" },
  "buyer-marriage-certificate": { block: "buyer", type: "Certidão de casamento" },
  "spouse-id": { block: "spouse", type: "RG ou CNH do cônjuge" },
  "spouse-cpf": { block: "spouse", type: "CPF do cônjuge" },
  "spouse-certificate": { block: "spouse", type: "Certidão do cônjuge" },
};

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

function resolveHasSpouse(
  identifierType: BuyerIdentifierType,
  maritalStatus: MaritalStatusValue,
  hasSpouse?: boolean,
) {
  return (
    identifierType !== "cnpj" &&
    ((hasSpouse ?? false) || maritalStatus === "married" || maritalStatus === "stable_union")
  );
}

function buildDocuments(
  identifierType: BuyerIdentifierType,
  maritalStatus: MaritalStatusValue,
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

  if (!maritalStatus) {
    return [];
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
      title: "Contrato ou escritura de união estável",
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

function mergeDocuments(
  currentDocuments: BuyerDocument[],
  identifierType: BuyerIdentifierType,
  maritalStatus: MaritalStatusValue,
): BuyerDocument[] {
  const baseDocuments = buildDocuments(identifierType, maritalStatus);

  return baseDocuments.map((baseDocument) => {
    const existingDocument = currentDocuments.find((item) => item.id === baseDocument.id);

    if (!existingDocument) {
      return baseDocument;
    }

    return {
      ...baseDocument,
      status: existingDocument.status,
      fileName: existingDocument.fileName,
      fileType: existingDocument.fileType,
      fileSizeKb: existingDocument.fileSizeKb,
      previewUrl: existingDocument.previewUrl,
      rejectionReason: existingDocument.rejectionReason,
    };
  });
}

function buildTimeline(status: TrackerStatus): TimelineStage[] {
  if (status === "completed") {
    return [
      {
        id: "certificate",
        title: "Certificado",
        status: "completed",
        description: "Documentos iniciais validados.",
      },
      {
        id: "contract",
        title: "Contrato",
        status: "completed",
        description: "Contrato assinado e confirmado.",
      },
      {
        id: "registry",
        title: "Registro",
        status: "completed",
        description: "Registro final concluído.",
      },
    ];
  }

  if (status === "waiting_user") {
    return [
      {
        id: "certificate",
        title: "Certificado",
        status: "in_progress",
        description: "Há um documento aguardando seu envio.",
      },
      {
        id: "contract",
        title: "Contrato",
        status: "pending",
        description: "Será iniciado após a validação do certificado.",
      },
      {
        id: "registry",
        title: "Registro",
        status: "pending",
        description: "Última etapa do processo.",
      },
    ];
  }

  return [
    {
      id: "certificate",
      title: "Certificado",
      status: "completed",
      description: "Dados validados e cadastro confirmado.",
    },
    {
      id: "contract",
      title: "Contrato",
      status: "in_progress",
      description: "Equipe conferindo documentos e contrato.",
    },
    {
      id: "registry",
      title: "Registro",
      status: "pending",
      description: "Será iniciado após a assinatura do contrato.",
    },
  ];
}

function normalizeAccessData(
  access?: Partial<BuyerAccessData> & { cpf?: string },
): BuyerAccessData {
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
    const hasSpouse = resolveHasSpouse(
      snapshot.identifierType,
      snapshot.maritalStatus,
      snapshot.hasSpouse,
    );
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
      buyerId: snapshot.buyerId,
      processId: snapshot.processId,
      basicDataConfirmed: snapshot.basicDataConfirmed,
      access,
      property: snapshot.property,
      isPropertyConfirmed: snapshot.basicDataConfirmed,
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
      hasSpouse,
      eNotariadoConfirmed: false,
      documents: mergeDocuments(
        snapshot.documents,
        snapshot.identifierType,
        snapshot.maritalStatus,
      ),
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
  const maritalStatus: MaritalStatusValue = "";

  return {
    step: initialStep,
    buyerId: null,
    processId: null,
    basicDataConfirmed: false,
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
    const access = normalizeAccessData(parsedState.access);
    const maritalStatus =
      parsedState.maritalStatus ??
      (access.identifierType === "cnpj" ? "single" : "");

    return {
      ...buildInitialState(initialStep, includeLoginStep, snapshot),
      ...parsedState,
      access,
      personalData: {
        ...buildPersonalData(access.identifierType, access.documentNumber),
        ...parsedState.personalData,
        cpf: parsedState.personalData?.cpf ?? access.documentNumber,
      },
      hasSpouse: resolveHasSpouse(access.identifierType, maritalStatus, parsedState.hasSpouse),
      documents: mergeDocuments(
        parsedState.documents ?? [],
        access.identifierType,
        maritalStatus,
      ),
      timeline: buildTimeline(parsedState.trackerStatus ?? "in_progress"),
    };
  } catch {
    return buildInitialState(initialStep, includeLoginStep, snapshot);
  }
}

function shouldSyncSnapshot(currentState: OnboardingState, nextState: OnboardingState) {
  return (
    currentState.buyerId !== nextState.buyerId ||
    currentState.processId !== nextState.processId ||
    currentState.maritalStatus !== nextState.maritalStatus ||
    currentState.hasSpouse !== nextState.hasSpouse ||
    (currentState.documents.length === 0 && nextState.documents.length > 0)
  );
}

function revokeDocumentPreview(previewUrl: string | null) {
  if (previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl);
  }
}

export function OnboardingPage({
  includeLoginStep = true,
  initialStep = "login",
  persistProgress = true,
}: OnboardingPageProps = {}) {
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const buyerProcessQuery = useBuyerProcessQuery();
  const [state, setState] = useState<OnboardingState>(() =>
    persistProgress
      ? loadInitialState(initialStep, includeLoginStep)
      : buildInitialState(initialStep, includeLoginStep),
  );
  const [isBooting, setIsBooting] = useState(true);
  const [documentFiles, setDocumentFiles] = useState<Record<string, File>>({});
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitModalStatus, setSubmitModalStatus] = useState<"loading" | "error">("loading");
  const [submitModalErrorMessage, setSubmitModalErrorMessage] = useState<string | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!buyerProcessQuery.data) {
      return;
    }

    const nextState = buildInitialState(initialStep, includeLoginStep, buyerProcessQuery.data);
    let shouldResetFiles = false;

    setState((currentState) => {
      if (!shouldSyncSnapshot(currentState, nextState)) {
        return currentState;
      }

      shouldResetFiles = true;
      return nextState;
    });

    if (shouldResetFiles) {
      setDocumentFiles({});
    }
  }, [buyerProcessQuery.data, includeLoginStep, initialStep]);

  useEffect(() => {
    if (!persistProgress) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [persistProgress, state]);

  useEffect(
    () => () => {
      state.documents.forEach((document) => revokeDocumentPreview(document.previewUrl));
    },
    [state.documents],
  );

  const isCompanyFlow = state.access.identifierType === "cnpj";

  const visibleSteps = useMemo(() => {
    const steps: OnboardingState["step"][] = includeLoginStep
      ? ["login", "property", "personal"]
      : ["property", "personal"];

    if (!isCompanyFlow) {
      steps.push("marital");
    }

    steps.push("documents", "review");
    return steps;
  }, [includeLoginStep, isCompanyFlow]);

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
      navigate(routes.processTracker, { replace: true });
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
      setState((currentState) => ({
        ...currentState,
        step: currentState.basicDataConfirmed
          ? resolveOnboardingStep(currentState, includeLoginStep)
          : "property",
      }));
      toast({
        title: "Acesso validado",
        description: "Sua jornada de onboarding foi iniciada.",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!session?.token) {
        throw new Error("Sessão inválida. Faça login novamente.");
      }

      if (!state.buyerId) {
        throw new Error("Comprador não identificado para atualização.");
      }

      const numericProcessId = parseProcessId(state.processId);
      if (!numericProcessId) {
        throw new Error("Processo não identificado para envio dos documentos.");
      }

      await updateBuyer(
        state.buyerId,
        {
          name: normalizeOptionalText(state.personalData.fullName),
          cpf: normalizeOptionalText(onlyDigits(state.personalData.cpf)),
          email: normalizeOptionalText(state.personalData.email),
          phone: normalizeOptionalText(onlyDigits(state.personalData.phone)),
          basicDataConfirmed: true,
          maritalStatus: state.access.identifierType === "cnpj" ? null : state.maritalStatus,
          nationality: normalizeOptionalText(state.personalData.nationality),
          profession: normalizeOptionalText(state.personalData.profession),
          birthDate: normalizeOptionalText(state.personalData.birthDate),
          hasEnotariadoCertificate: state.eNotariadoConfirmed,
          spouseName: state.hasSpouse ? normalizeOptionalText(state.spouseData.fullName) : null,
          spouseCpf: state.hasSpouse
            ? normalizeOptionalText(onlyDigits(state.spouseData.cpf))
            : null,
          spouseBirthDate: state.hasSpouse
            ? normalizeOptionalText(state.spouseData.birthDate)
            : null,
          spouseEmail: state.hasSpouse ? normalizeOptionalText(state.spouseData.email) : null,
          spousePhone: state.hasSpouse
            ? normalizeOptionalText(onlyDigits(state.spouseData.phone))
            : null,
        },
        session.token,
      );

      const uploadEntries = Object.entries(documentFiles).filter(([documentId]) =>
        state.documents.some((document) => document.id === documentId),
      );

      for (const [documentId, file] of uploadEntries) {
        const config = documentUploadConfig[documentId];
        if (!config) {
          throw new Error(`Documento sem configuração de upload: ${documentId}.`);
        }

        await uploadBuyerDocument(
          {
            processId: numericProcessId,
            block: config.block,
            type: config.type,
            uploadedBy: "buyer",
            file,
          },
          session.token,
        );
      }

      await queryClient.invalidateQueries({
        queryKey: getBuyerProcessQueryKey(session),
      });

      const refreshed = await buyerProcessQuery.refetch();
      return refreshed.data ?? null;
    },
    onMutate: () => {
      setSubmitModalStatus("loading");
      setSubmitModalErrorMessage(null);
      setSubmitModalOpen(true);
    },
    onSuccess: (snapshot) => {
      setDocumentFiles({});
      setSubmitModalOpen(false);
      toast({
        title: "Enviado para análise",
        description: "Agora você pode acompanhar o processo em tempo real.",
      });
      navigate(routes.processTracker, { replace: true });
    },
    onError: (error) => {
      setSubmitModalStatus("error");
      setSubmitModalErrorMessage(
        getApiErrorMessage(error, "Não foi possível enviar suas informações para análise."),
      );
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

    setDocumentFiles((currentFiles) => ({
      ...currentFiles,
      [documentId]: file,
    }));

    updateState((currentState) => ({
      ...currentState,
      documents: currentState.documents.map((document) => {
        if (document.id !== documentId) {
          return document;
        }

        revokeDocumentPreview(document.previewUrl);

        return {
          ...document,
          status: "uploaded",
          fileName: file.name,
          fileType: file.type || file.name.split(".").pop()?.toUpperCase() || "Arquivo",
          fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
          previewUrl,
          rejectionReason: null,
        };
      }),
    }));

    toast({
      title: "Documento enviado",
      description: `${file.name} foi salvo automaticamente.`,
    });
  };

  const handleDocumentRemove = (documentId: string) => {
    setDocumentFiles((currentFiles) => {
      const nextFiles = { ...currentFiles };
      delete nextFiles[documentId];
      return nextFiles;
    });

    updateState((currentState) => ({
      ...currentState,
      documents: currentState.documents.map((document) => {
        if (document.id !== documentId) {
          return document;
        }

        revokeDocumentPreview(document.previewUrl);

        return {
          ...document,
          status: "pending",
          fileName: null,
          fileType: null,
          fileSizeKb: null,
          previewUrl: null,
          rejectionReason: null,
        };
      }),
    }));

    toast({
      title: "Arquivo removido",
      description: "O documento voltou para o estado pendente.",
    });
  };

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
              {getApiErrorMessage(buyerProcessQuery.error, "Tente novamente em alguns segundos.")}
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
              maritalStatus:
                access.identifierType === "cnpj"
                  ? "single"
                  : currentState.access.identifierType === "cnpj"
                    ? ""
                    : currentState.maritalStatus,
              hasSpouse:
                access.identifierType === "cnpj"
                  ? false
                  : currentState.access.identifierType === "cnpj"
                    ? false
                    : currentState.hasSpouse,
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
                access.identifierType === "cnpj"
                  ? "single"
                  : currentState.access.identifierType === "cnpj"
                    ? ""
                    : currentState.maritalStatus,
              ),
            }));
            loginMutation.mutate();
          }}
        />
      ) : null}

      {state.step === "property" ? (
        <EmpreendimentoStep
          value={state.property}
          title="Confira os dados do seu imóvel"
          currentStep={currentStepNumber}
          totalSteps={visibleSteps.length}
          onReportError={() =>
            toast({
              title: "Empreendimento incorreto?",
              description:
                "Se os dados do empreendimento estiverem errados, pare o preenchimento e entre em contato com a equipe responsável para correção.",
            })
          }
          onBack={
            includeLoginStep
              ? () => updateState((currentState) => ({ ...currentState, step: "login" }))
              : undefined
          }
          onConfirm={() =>
            updateState((currentState) => ({
              ...currentState,
              isPropertyConfirmed: true,
              step: "personal",
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
          onChange={(personalData) =>
            updateState((currentState) => ({ ...currentState, personalData }))
          }
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
          onContinue={(maritalStatus) =>
            updateState((currentState) => ({
              ...currentState,
              maritalStatus,
              hasSpouse: maritalStatus !== "single",
              spouseData:
                maritalStatus === "single" ? buildEmptySpouseData() : currentState.spouseData,
              documents: mergeDocuments(
                currentState.documents,
                currentState.access.identifierType,
                maritalStatus,
              ),
              step: "documents",
            }))
          }
        />
      ) : null}

      {state.step === "documents" ? (
        <DocumentsStep
          documents={state.documents}
          currentStep={currentStepNumber}
          totalSteps={visibleSteps.length}
          onBack={() =>
            updateState((currentState) => ({
              ...currentState,
              step: isCompanyFlow ? "personal" : "marital",
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

      <SubmitStatusDialog
        open={submitModalOpen}
        status={submitModalStatus}
        errorMessage={submitModalErrorMessage}
        onOpenChange={setSubmitModalOpen}
      />
    </div>
  );
}
