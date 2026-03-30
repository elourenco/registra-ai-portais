import {
  createMockSession,
  type SessionData,
} from "@registra/shared";

import {
  customerLoginSchema,
  type CustomerLoginInput,
} from "@/features/auth/core/customer-login-schema";
import { portalConfig } from "@/shared/config/portal-config";

export async function loginRequest(payload: CustomerLoginInput): Promise<SessionData> {
  const parsedPayload = customerLoginSchema.parse(payload);

  await new Promise((resolve) => {
    setTimeout(resolve, 650);
  });

  return createMockSession(
    portalConfig.role,
    `${parsedPayload.documentNumber}@customer.registra.ai`,
  );
}
