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
        path: routes.developments,
        lazy: async () => {
          const module = await import("@/features/developments/pages/developments-page");
          return { Component: module.DevelopmentsPage };
        },
      },
      {
        path: routes.developmentCreate,
        lazy: async () => {
          const module = await import("@/features/developments/pages/development-create-page");
          return { Component: module.DevelopmentCreatePage };
        },
      },
      {
        path: routes.developmentDetail,
        lazy: async () => {
          const module = await import("@/features/developments/pages/development-detail-page");
          return { Component: module.DevelopmentDetailPage };
        },
      },
      {
        path: routes.developmentBuyerCreate,
        lazy: async () => {
          const module = await import("@/features/developments/pages/development-buyer-create-page");
          return { Component: module.DevelopmentBuyerCreatePage };
        },
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={routes.dashboard} replace />,
  },
]);
