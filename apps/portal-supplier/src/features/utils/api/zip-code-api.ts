import { z } from "zod";

const zipCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length === 8);

const viaCepResponseSchema = z
  .object({
    cep: z.string().optional(),
    logradouro: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    localidade: z.string().optional(),
    uf: z.string().optional(),
    erro: z.boolean().optional(),
  })
  .passthrough();

export interface ZipCodeAddress {
  zipCode: string;
  street: string;
  district: string;
  city: string;
  state: string;
  complement?: string;
}

function pickText(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return value.trim();
}

export async function lookupAddressByZipCode(zipCodeInput: string): Promise<ZipCodeAddress | null> {
  const parsedZipCode = zipCodeSchema.safeParse(zipCodeInput);

  if (!parsedZipCode.success) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${parsedZipCode.data}/json/`);

    if (!response.ok) {
      return null;
    }

    const payload = viaCepResponseSchema.safeParse(await response.json());

    if (!payload.success || payload.data.erro) {
      return null;
    }

    return {
      zipCode: pickText(payload.data.cep),
      street: pickText(payload.data.logradouro),
      district: pickText(payload.data.bairro),
      city: pickText(payload.data.localidade),
      state: pickText(payload.data.uf).toUpperCase(),
      complement: pickText(payload.data.complemento),
    };
  } catch {
    return null;
  }
}
