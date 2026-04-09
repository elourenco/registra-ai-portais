import { motion } from "motion/react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import { LoginForm } from "@/features/auth/components/login-form";
import { routes } from "@/shared/constants/routes";

export function LoginPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={routes.processTracker} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.2),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(45,212,191,0.18),transparent_35%)]"
      />
      <LoginForm />
    </div>
  );
}
