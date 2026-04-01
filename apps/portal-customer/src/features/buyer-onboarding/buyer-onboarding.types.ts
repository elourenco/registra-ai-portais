export type MaritalStatusOption = "single" | "married" | "stable_union";
export type DocumentStatus = "pending" | "uploaded" | "approved" | "rejected";
export type TrackerStatus = "in_progress" | "in_review" | "waiting_user" | "completed";
export type TrackerStageStatus = "pending" | "in_progress" | "completed";

export type BuyerIdentifierType = "cpf" | "cnpj";

export interface BuyerAccessData {
  identifierType: BuyerIdentifierType;
  documentNumber: string;
  accessCode: string;
}

export interface PropertyConfirmation {
  name: string;
  cnpj: string;
  address: string;
  unitLabel: string;
  acquisitionType: string;
  purchaseValue: string;
}

export interface PersonalData {
  fullName: string;
  cpf: string;
  birthDate: string;
  nationality: string;
  profession: string;
  email: string;
  phone: string;
}

export interface SpouseData {
  fullName: string;
  cpf: string;
  birthDate: string;
  email: string;
  phone: string;
}

export interface BuyerDocument {
  id: string;
  title: string;
  owner: "buyer" | "spouse" | "backoffice";
  status: DocumentStatus;
  fileName: string | null;
  fileType: string | null;
  fileSizeKb: number | null;
  previewUrl: string | null;
  rejectionReason: string | null;
}

export interface TimelineStage {
  id: "certificate" | "contract" | "registry";
  title: string;
  status: TrackerStageStatus;
  description: string;
}

export interface OnboardingState {
  step: "login" | "property" | "personal" | "marital" | "spouse" | "documents" | "review" | "tracker";
  buyerId: string | null;
  processId: string | null;
  basicDataConfirmed: boolean;
  access: BuyerAccessData;
  property: PropertyConfirmation;
  isPropertyConfirmed: boolean;
  personalData: PersonalData;
  maritalStatus: MaritalStatusOption;
  spouseData: SpouseData;
  hasSpouse: boolean;
  eNotariadoConfirmed: boolean;
  documents: BuyerDocument[];
  submittedAt: string | null;
  trackerStatus: TrackerStatus;
  timeline: TimelineStage[];
}
