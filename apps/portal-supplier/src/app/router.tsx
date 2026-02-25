import { createBrowserRouter, Navigate } from "react-router-dom";

import { ProtectedLayout } from "@/app/layouts/protected-layout";
import { LoginPage } from "@/features/auth/pages/login-page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
import { OnboardingPage } from "@/features/onboarding/pages/onboarding-page";
import { SupplierSignupPage } from "@/features/onboarding/pages/supplier-signup-page";
import { routes } from "@/shared/constants/routes";

export const router = createBrowserRouter([
  {
    path: routes.onboarding,
    element: <OnboardingPage />,
  },
  {
    path: routes.supplierSignup,
    element: <SupplierSignupPage />,
  },
  {
    path: routes.login,
    element: <LoginPage />,
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <Navigate to={routes.dashboard} replace />,
      },
      {
        path: routes.dashboard,
        element: <DashboardPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={routes.dashboard} replace />,
  },
]);
