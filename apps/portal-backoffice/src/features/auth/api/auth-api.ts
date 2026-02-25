import {
  type LoginInput,
  loginSchema,
  type SessionData,
  type UserRole,
} from "@registra/shared";
import { z } from "zod";

import { apiRequest } from "@/shared/api/http-client";
import { portalConfig } from "@/shared/config/portal-config";

const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
  }),
});

type AuthResponse = z.infer<typeof authResponseSchema>;

function mapPortalRoleToSessionRole(): UserRole {
  return portalConfig.role;
}

function toSessionData(response: AuthResponse): SessionData {
  return {
    token: response.accessToken,
    user: {
      id: response.user.id,
      name: response.user.name,
      email: response.user.email,
      role: mapPortalRoleToSessionRole(),
    },
  };
}

export async function loginRequest(payload: LoginInput): Promise<SessionData> {
  const parsedPayload = loginSchema.parse(payload);

  const authResponse = await apiRequest<unknown>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: parsedPayload.email,
      password: parsedPayload.password,
      portal: portalConfig.role,
    }),
  });

  const parsedResponse = authResponseSchema.parse(authResponse);

  return toSessionData(parsedResponse);
}
