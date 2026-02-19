import { motion } from "motion/react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import { SupplierOnboardingForm } from "@/features/onboarding/components/supplier-onboarding-form";
import { routes } from "@/shared/constants/routes";

export function OnboardingPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={routes.dashboard} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.24),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(132,204,22,0.20),transparent_36%)]"
      />
      <SupplierOnboardingForm />
    </div>
  );
}
