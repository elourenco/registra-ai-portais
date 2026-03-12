import { RouteHydrateFallback } from "@registra/ui";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { ProtectedLayout } from "@/app/layouts/protected-layout";
import { routes } from "@/shared/constants/routes";

export const router = createBrowserRouter([
  {
    path: routes.onboarding,
    hydrateFallbackElement: <RouteHydrateFallback />,
    lazy: async () => {
      const module = await import("@/features/onboarding/pages/onboarding-page");
      return { Component: module.OnboardingPage };
    },
  },
  {
    path: routes.supplierSignup,
    hydrateFallbackElement: <RouteHydrateFallback />,
    lazy: async () => {
      const module = await import("@/features/onboarding/pages/supplier-signup-page");
      return { Component: module.SupplierSignupPage };
    },
  },
  {
    path: routes.login,
    hydrateFallbackElement: <RouteHydrateFallback />,
    lazy: async () => {
      const module = await import("@/features/auth/pages/login-page");
      return { Component: module.LoginPage };
    },
  },
  {
    element: <ProtectedLayout />,
    hydrateFallbackElement: <RouteHydrateFallback />,
    children: [
      {
        index: true,
        element: <Navigate to={routes.dashboard} replace />,
      },
      {
        path: routes.dashboard,
        lazy: async () => {
          const module = await import("@/features/dashboard/pages/dashboard-page");
          return { Component: module.DashboardPage };
        },
      },
      {
        path: routes.workflow,
        lazy: async () => {
          const module = await import("@/features/workflow/pages/workflow-page");
          return { Component: module.WorkflowPage };
        },
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={routes.dashboard} replace />,
  },
]);
