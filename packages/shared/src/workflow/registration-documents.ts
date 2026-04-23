export const REGISTRATION_BLOCK = "registration";

export const REGISTRATION_DOCUMENT_TYPES = {
  itbiGuide: "itbi_guide",
  itbiReceipt: "itbi_receipt",
  deed: "deed",
  registeredDeed: "registered_deed",
} as const;

export type RegistrationDocumentType =
  (typeof REGISTRATION_DOCUMENT_TYPES)[keyof typeof REGISTRATION_DOCUMENT_TYPES];

export const REGISTRATION_DOCUMENT_TYPE_LABELS: Record<RegistrationDocumentType, string> = {
  itbi_guide: "Guia de ITBI",
  itbi_receipt: "Comprovante ITBI",
  deed: "Escritura",
  registered_deed: "Matrícula registrada",
};

export function isRegistrationDocumentType(
  value: string | null | undefined,
): value is RegistrationDocumentType {
  return Object.values(REGISTRATION_DOCUMENT_TYPES).includes(value as RegistrationDocumentType);
}
