import { clearSession, getSession, type SessionData, saveSession } from "@registra/shared";
import { createContext, type PropsWithChildren, useContext, useMemo, useState } from "react";

interface AuthContextValue {
  isAuthenticated: boolean;
  session: SessionData | null;
  login: (session: SessionData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getInitialSession(): SessionData | null {
  const currentSession = getSession();

  if (!currentSession?.token) {
    return null;
  }

  // Cleanup for sessions created by previous mock auth flow.
  if (currentSession.token.startsWith("mock-token-")) {
    clearSession();
    return null;
  }

  return currentSession;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionData | null>(getInitialSession);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(session?.token),
      session,
      login: (nextSession) => {
        saveSession(nextSession);
        setSession(nextSession);
      },
      logout: () => {
        clearSession();
        setSession(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa ser usado dentro do AuthProvider");
  }
  return context;
}
