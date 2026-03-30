import { RouteHydrateFallback } from "@registra/ui";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { ProtectedLayout } from "@/app/layouts/protected-layout";
import { routes } from "@/shared/constants/routes";

export const router = createBrowserRouter([
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
        element: <Navigate to={routes.process} replace />,
      },
      {
        path: routes.dashboard,
        element: <Navigate to={routes.process} replace />,
      },
      {
        path: routes.process,
        lazy: async () => {
          const module = await import("@/features/buyer-onboarding/onboarding-page");
          return {
            Component: () => (
              <module.OnboardingPage
                includeLoginStep={false}
                initialStep="property"
                persistProgress={false}
              />
            ),
          };
        },
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={routes.process} replace />,
  },
]);
