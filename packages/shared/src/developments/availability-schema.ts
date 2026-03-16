import { z } from "zod";

export const availabilityStatusSchema = z.enum([
  "available",
  "reserved",
  "sold",
  "blocked",
]);

export const availabilityStructureTypeSchema = z.enum([
  "simple",
  "tower_unit",
  "block_unit",
  "block_lot",
]);

export const availabilityMetadataSchema = z.object({
  tower: z.string().trim().optional(),
  floor: z.union([z.number().int().positive(), z.string().trim().min(1)]).nullable().optional(),
  block: z.string().trim().optional(),
  unitNumber: z.string().trim().optional(),
  lot: z.string().trim().optional(),
});

export const availabilityItemSchema = z.object({
  id: z.string().min(1),
  developmentId: z.string().min(1),
  displayLabel: z.string().min(1),
  status: availabilityStatusSchema,
  structureType: availabilityStructureTypeSchema,
  metadata: availabilityMetadataSchema,
  buyerId: z.string().trim().nullable().optional(),
  processId: z.string().trim().nullable().optional(),
  linkedBuyerName: z.string().trim().nullable().optional(),
  blockedReason: z.string().trim().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const createAvailabilityItemInputSchema = z
  .object({
    structureType: availabilityStructureTypeSchema,
    prefix: z.string().trim().max(24).optional(),
    status: availabilityStatusSchema.optional(),
    metadata: availabilityMetadataSchema,
    blockedReason: z.string().trim().max(160).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.structureType === "simple" && !value.metadata.unitNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["metadata", "unitNumber"],
        message: "Informe a unidade.",
      });
    }

    if (value.structureType === "tower_unit") {
      if (!value.metadata.tower) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["metadata", "tower"],
          message: "Informe a torre.",
        });
      }

      if (!value.metadata.unitNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["metadata", "unitNumber"],
          message: "Informe a unidade.",
        });
      }
    }

    if (value.structureType === "block_unit") {
      if (!value.metadata.block) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["metadata", "block"],
          message: "Informe o bloco.",
        });
      }

      if (!value.metadata.unitNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["metadata", "unitNumber"],
          message: "Informe a casa.",
        });
      }
    }

    if (value.structureType === "block_lot") {
      if (!value.metadata.block) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["metadata", "block"],
          message: "Informe a quadra.",
        });
      }

      if (!value.metadata.lot) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["metadata", "lot"],
          message: "Informe o lote.",
        });
      }
    }
  });

export const updateAvailabilityItemInputSchema = z.object({
  status: availabilityStatusSchema.optional(),
  prefix: z.string().trim().max(24).optional(),
  metadata: availabilityMetadataSchema.optional(),
  blockedReason: z.string().trim().max(160).nullable().optional(),
});

export const generateAvailabilityInputSchema = z
  .object({
    structureType: availabilityStructureTypeSchema,
    prefix: z.string().trim().max(24).optional(),
    totalUnits: z.coerce.number().int().positive().optional(),
    totalTowers: z.coerce.number().int().positive().optional(),
    unitsPerTower: z.coerce.number().int().positive().optional(),
    totalBlocks: z.coerce.number().int().positive().optional(),
    unitsPerBlock: z.coerce.number().int().positive().optional(),
    lotsPerBlock: z.coerce.number().int().positive().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.structureType === "simple" && !value.totalUnits) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalUnits"],
        message: "Informe a quantidade total de unidades.",
      });
    }

    if (value.structureType === "tower_unit") {
      if (!value.totalTowers) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["totalTowers"],
          message: "Informe a quantidade de torres.",
        });
      }

      if (!value.unitsPerTower) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["unitsPerTower"],
          message: "Informe quantas unidades existem por torre.",
        });
      }
    }

    if (value.structureType === "block_unit") {
      if (!value.totalBlocks) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["totalBlocks"],
          message: "Informe a quantidade de blocos ou quadras.",
        });
      }

      if (!value.unitsPerBlock) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["unitsPerBlock"],
          message: "Informe quantas unidades existem por bloco.",
        });
      }
    }

    if (value.structureType === "block_lot") {
      if (!value.totalBlocks) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["totalBlocks"],
          message: "Informe a quantidade de quadras.",
        });
      }

      if (!value.lotsPerBlock) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lotsPerBlock"],
          message: "Informe quantos lotes existem por quadra.",
        });
      }
    }
  });

export const availabilitySummarySchema = z.object({
  total: z.number().int().min(0),
  available: z.number().int().min(0),
  reserved: z.number().int().min(0),
  sold: z.number().int().min(0),
  blocked: z.number().int().min(0),
});

export const availabilityListResponseSchema = z.object({
  items: z.array(availabilityItemSchema),
  summary: availabilitySummarySchema,
});

export type AvailabilityStatus = z.infer<typeof availabilityStatusSchema>;
export type AvailabilityStructureType = z.infer<typeof availabilityStructureTypeSchema>;
export type AvailabilityMetadata = z.infer<typeof availabilityMetadataSchema>;
export type AvailabilityItem = z.infer<typeof availabilityItemSchema>;
export type CreateAvailabilityItemInput = z.infer<typeof createAvailabilityItemInputSchema>;
export type GenerateAvailabilityInput = z.infer<typeof generateAvailabilityInputSchema>;
export type AvailabilitySummary = z.infer<typeof availabilitySummarySchema>;
export type AvailabilityListResponse = z.infer<typeof availabilityListResponseSchema>;
export type UpdateAvailabilityItemInput = z.infer<typeof updateAvailabilityItemInputSchema>;

export const availabilityStatusLabels: Record<AvailabilityStatus, string> = {
  available: "Disponível",
  reserved: "Reservada",
  sold: "Vendida",
  blocked: "Bloqueada",
};

export const availabilityStructureTypeLabels: Record<AvailabilityStructureType, string> = {
  simple: "Unidades simples",
  tower_unit: "Torre + unidade",
  block_unit: "Bloco + casa",
  block_lot: "Quadra + lote",
};

export function buildAvailabilityLabel(
  structureType: AvailabilityStructureType,
  metadata: AvailabilityMetadata,
  prefix?: string,
): string {
  const safePrefix = prefix?.trim();

  if (structureType === "tower_unit") {
    const tower = metadata.tower ? `Torre ${metadata.tower}` : "Torre";
    const unit = metadata.unitNumber ? `Unidade ${metadata.unitNumber}` : "Unidade";
    return [safePrefix, tower, unit].filter(Boolean).join(" - ");
  }

  if (structureType === "block_unit") {
    const block = metadata.block ? `Bloco ${metadata.block}` : "Bloco";
    const unit = metadata.unitNumber ? `Casa ${metadata.unitNumber}` : "Casa";
    return [safePrefix, block, unit].filter(Boolean).join(" - ");
  }

  if (structureType === "block_lot") {
    const block = metadata.block ? `Quadra ${metadata.block}` : "Quadra";
    const lot = metadata.lot ? `Lote ${metadata.lot}` : "Lote";
    return [safePrefix, block, lot].filter(Boolean).join(" - ");
  }

  const unit = metadata.unitNumber ? `Unidade ${metadata.unitNumber}` : "Unidade";
  return [safePrefix, unit].filter(Boolean).join(" - ");
}

export function buildAvailabilitySummary(items: AvailabilityItem[]): AvailabilitySummary {
  return items.reduce<AvailabilitySummary>(
    (summary, item) => {
      summary.total += 1;
      summary[item.status] += 1;
      return summary;
    },
    {
      total: 0,
      available: 0,
      reserved: 0,
      sold: 0,
      blocked: 0,
    },
  );
}
