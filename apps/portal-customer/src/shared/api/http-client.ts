import { clearSession } from "@registra/shared";
import { portalConfig } from "@/shared/config/portal-config";

const DEFAULT_API_BASE_URL = "http://localhost:3000";

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");

interface ApiErrorPayload {
  message?: string;
  details?: string;
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.message === undefined || typeof candidate.message === "string") &&
    (candidate.details === undefined || typeof candidate.details === "string")
  );
}

async function parseJsonBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return null;
  }

  return response.json();
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

function toApiClientError(status: number, body: unknown): ApiClientError {
  if (isApiErrorPayload(body)) {
    return new ApiClientError(body.message ?? "Falha na requisição da API.", status, body.details);
  }

  return new ApiClientError("Falha na requisição da API.", status);
}

interface ApiRequestOptions extends Omit<RequestInit, "headers"> {
  token?: string;
  headers?: HeadersInit;
}

export async function apiRequest<TResponse>(
  path: string,
  { token, headers, ...init }: ApiRequestOptions = {},
): Promise<TResponse> {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  requestHeaders.set("x-portal", portalConfig.role);

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  if (init.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: requestHeaders,
  });

  const responseBody = await parseJsonBody(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    throw toApiClientError(response.status, responseBody);
  }

  return responseBody as TResponse;
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
