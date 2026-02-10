import { clearSession, getSession, type SessionData, saveSession } from "@registra/shared";
import { createContext, type PropsWithChildren, useContext, useMemo, useState } from "react";

interface AuthContextValue {
  isAuthenticated: boolean;
  session: SessionData | null;
  login: (session: SessionData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionData | null>(() => getSession());

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
