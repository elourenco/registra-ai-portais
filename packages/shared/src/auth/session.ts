import type { AuthUser, UserRole } from "../types/user";

export interface SessionData {
  token: string;
  user: AuthUser;
}

const SESSION_KEY = "registra-ai.session";

export function createMockSession(role: UserRole, email: string): SessionData {
  return {
    token: `mock-token-${role}`,
    user: {
      id: crypto.randomUUID(),
      name: email.split("@")[0] ?? "Usuário",
      email,
      role,
    },
  };
}

export function saveSession(session: SessionData): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): SessionData | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSessionKey(): string {
  return SESSION_KEY;
}
