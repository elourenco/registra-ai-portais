import {
  type SessionData,
  type UserRole,
} from "@registra/shared";
import { z } from "zod";

import {
  customerLoginSchema,
  type CustomerLoginInput,
} from "@/features/auth/core/customer-login-schema";
import { apiRequest } from "@/shared/api/http-client";
import { portalConfig } from "@/shared/config/portal-config";

const buyerAuthResponseSchema = z.object({
  accessToken: z.string().min(1),
  buyer: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    cpf: z.string().min(1),
    email: z.string().email(),
  }).optional().nullable(),
});

type BuyerAuthResponse = z.infer<typeof buyerAuthResponseSchema>;

function mapPortalRoleToSessionRole(): UserRole {
  return portalConfig.role;
}

function toSessionData(response: BuyerAuthResponse, cpf: string): SessionData {
  return {
    token: response.accessToken,
    user: {
      id: response.buyer?.id ?? cpf,
      name: response.buyer?.name.trim() || "Comprador",
      email: response.buyer?.email.trim() || `${cpf}@customer.registra.ai`,
      role: mapPortalRoleToSessionRole(),
    },
  };
}

export async function loginRequest(payload: CustomerLoginInput): Promise<SessionData> {
  const parsedPayload = customerLoginSchema.parse(payload);

  const authResponse = await apiRequest<unknown>("/api/v1/auth/buyer/login", {
    method: "POST",
    body: JSON.stringify({
      cpf: parsedPayload.documentNumber,
      accessKey: parsedPayload.accessCode,
    }),
  });

  const parsedResponse = buyerAuthResponseSchema.parse(authResponse);

  return toSessionData(parsedResponse, parsedPayload.documentNumber);
}
