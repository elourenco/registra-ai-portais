import { Button, LogOutIcon } from "@registra/ui";
import { motion } from "motion/react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/auth-provider";
import { portalConfig } from "@/shared/config/portal-config";
import { routes } from "@/shared/constants/routes";

export function ProtectedLayout() {
  const navigate = useNavigate();
  const { session, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={routes.login} replace />;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col p-6">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between rounded-xl border bg-card/80 p-4 backdrop-blur"
      >
        <div>
          <p className="text-sm text-muted-foreground">{portalConfig.name}</p>
          <h1 className="text-lg font-semibold">Olá, {session?.user.name}</h1>
        </div>

        <Button
          variant="secondary"
          className="gap-2"
          onClick={() => {
            logout();
            navigate(routes.login, { replace: true });
          }}
        >
          <LogOutIcon className="h-4 w-4" />
          Sair
        </Button>
      </motion.header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
