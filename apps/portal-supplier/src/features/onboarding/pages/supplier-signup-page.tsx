import type { SupplierCompanyProfile } from "@registra/shared";
import { motion } from "motion/react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import { SupplierSignupForm } from "@/features/onboarding/components/supplier-signup-form";
import { routes } from "@/shared/constants/routes";

interface SupplierSignupLocationState {
  company?: SupplierCompanyProfile;
}

export function SupplierSignupPage() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const company = (location.state as SupplierSignupLocationState | null)?.company;

  if (isAuthenticated) {
    return <Navigate to={routes.dashboard} replace />;
  }

  if (!company) {
    return <Navigate to={routes.onboarding} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.24),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(132,204,22,0.20),transparent_36%)]"
      />
      <SupplierSignupForm company={company} />
    </div>
  );
}
