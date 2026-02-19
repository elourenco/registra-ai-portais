import { z } from "zod";

const CNPJ_LENGTH = 14;
const CNPJ_BASE_LENGTH = 12;
const cnpjPattern = /^[A-Z0-9]{14}$/;
const cnpjBasePattern = /^[A-Z0-9]{12}$/;
const cnpjVerifierPattern = /^\d{2}$/;

const firstVerifierWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const secondVerifierWeights = [6, ...firstVerifierWeights];

function getCnpjCharValue(char: string): number {
  return char.charCodeAt(0) - 48;
}

function calculateVerifierDigit(chars: string, weights: number[]): number {
  const sum = chars
    .split("")
    .reduce((acc, char, index) => acc + getCnpjCharValue(char) * (weights[index] ?? 0), 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function normalizeCnpj(value: string): string {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

export function formatCnpj(value: string): string {
  const cnpj = normalizeCnpj(value).slice(0, CNPJ_LENGTH);
  const base = cnpj.slice(0, CNPJ_BASE_LENGTH);
  const verifier = cnpj.slice(CNPJ_BASE_LENGTH, CNPJ_LENGTH);

  const maskedBase = base
    .replace(/^([A-Z0-9]{2})([A-Z0-9])/, "$1.$2")
    .replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})([A-Z0-9])/, "$1.$2.$3")
    .replace(/\.([A-Z0-9]{3})([A-Z0-9])/, ".$1/$2");

  return verifier ? `${maskedBase}-${verifier}` : maskedBase;
}

export function isValidCnpj(value: string): boolean {
  const cnpj = normalizeCnpj(value);

  if (cnpj.length !== CNPJ_LENGTH || !cnpjPattern.test(cnpj)) {
    return false;
  }

  const base = cnpj.slice(0, CNPJ_BASE_LENGTH);
  const verifierDigits = cnpj.slice(CNPJ_BASE_LENGTH, CNPJ_LENGTH);

  if (!cnpjBasePattern.test(base) || !cnpjVerifierPattern.test(verifierDigits)) {
    return false;
  }

  const firstVerifier = calculateVerifierDigit(base, firstVerifierWeights);
  const secondVerifier = calculateVerifierDigit(`${base}${firstVerifier}`, secondVerifierWeights);

  return verifierDigits === `${firstVerifier}${secondVerifier}`;
}

export const cnpjSchema = z
  .string()
  .trim()
  .transform((value) => normalizeCnpj(value))
  .refine((value) => value.length === CNPJ_LENGTH, "Informe um CNPJ com 14 caracteres")
  .refine((value) => isValidCnpj(value), "Informe um CNPJ válido");

export type Cnpj = z.infer<typeof cnpjSchema>;
