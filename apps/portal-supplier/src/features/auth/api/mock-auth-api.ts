import {
  createMockSession,
  type LoginInput,
  loginSchema,
  type SessionData,
} from "@registra/shared";

import { portalConfig } from "@/shared/config/portal-config";

export async function loginRequest(payload: LoginInput): Promise<SessionData> {
  const parsedPayload = loginSchema.parse(payload);

  await new Promise((resolve) => {
    setTimeout(resolve, 650);
  });

  return createMockSession(portalConfig.role, parsedPayload.email);
}
