import { ApiClientError } from "@/shared/api/http-client";

export function isUnauthorizedError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError && error.status === 401;
}

export function retryWithoutUnauthorized(failureCount: number, error: unknown): boolean {
  if (isUnauthorizedError(error)) {
    return false;
  }

  return failureCount < 2;
}
