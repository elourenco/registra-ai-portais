import { z } from "zod";

import { isRecord, pickNumber, pickText } from "@/shared/utils/api-normalizers";

const createdDevelopmentSchema = z.object({
  id: z.string().min(1),
  supplierId: z.string().nullable(),
  supplierCustomName: z.string().nullable(),
  name: z.string().min(2),
  developmentType: z.string().min(2),
  speCnpj: z.string().min(1),
  legalName: z.string().min(2),
  tradeName: z.string().nullable(),
  status: z.string().min(2),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type CreatedDevelopment = z.infer<typeof createdDevelopmentSchema>;

export function resolveCreateDevelopmentPath(): string {
  return import.meta.env.VITE_BACKOFFICE_DEVELOPMENTS_ENDPOINT ?? "/api/v1/developments";
}

export function toCreatedDevelopment(raw: unknown): CreatedDevelopment {
  const item = isRecord(raw) ? raw : {};

  return createdDevelopmentSchema.parse({
    id: pickText(item.id) ?? String(pickNumber(0, item.id)),
    supplierId: pickText(item.supplierId),
    supplierCustomName: pickText(item.supplierCustomName),
    name: pickText(item.name) ?? "Empreendimento",
    developmentType: pickText(item.developmentType) ?? "residential",
    speCnpj: pickText(item.speCnpj) ?? "-",
    legalName: pickText(item.legalName) ?? "Empreendimento",
    tradeName: pickText(item.tradeName),
    status: pickText(item.status) ?? "drafting",
    createdAt: pickText(item.createdAt) ?? new Date().toISOString(),
    updatedAt: pickText(item.updatedAt, item.createdAt) ?? new Date().toISOString(),
  });
}
