import { RouteHydrateFallback } from "@registra/ui";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

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
        path: "suppliers",
        element: <Outlet />,
        children: [
          {
            index: true,
            lazy: async () => {
              const module = await import("@/features/suppliers/pages/suppliers-page");
              return { Component: module.SuppliersPage };
            },
          },
          {
            path: ":supplierId",
            element: <Outlet />,
            children: [
              {
                path: "information",
                lazy: async () => {
                  const module = await import("@/features/suppliers/pages/supplier-detail-page");
                  return { Component: module.SupplierDetailPage };
                },
              },
              {
                path: "settings",
                lazy: async () => {
                  const module = await import("@/features/suppliers/pages/supplier-settings-page");
                  return { Component: module.SupplierSettingsPage };
                },
              },
              {
                path: "developments",
                lazy: async () => {
                  const module = await import("@/features/developments/pages/developments-page");
                  return { Component: module.DevelopmentsPage };
                },
              },
              {
                path: "developments/:developmentId",
                lazy: async () => {
                  const module = await import("@/features/developments/pages/development-detail-page");
                  return { Component: module.DevelopmentDetailPage };
                },
              },
              {
                path: "developments/:developmentId/buyers",
                lazy: async () => {
                  const module = await import("@/features/buyers/pages/buyers-page");
                  return { Component: module.BuyersPage };
                },
              },
              {
                path: "buyers",
                lazy: async () => {
                  const module = await import("@/features/buyers/pages/buyers-page");
                  return { Component: module.BuyersPage };
                },
              },
              {
                path: "developments/:developmentId/buyers/:buyerId",
                lazy: async () => {
                  const module = await import("@/features/buyers/pages/buyer-detail-page");
                  return { Component: module.BuyerDetailPage };
                },
              },
              {
                path: "developments/:developmentId/buyers/:buyerId/processes/:processId",
                lazy: async () => {
                  const module = await import("@/features/processes/pages/process-detail-page");
                  return { Component: module.ProcessDetailPage };
                },
              },
              {
                path: "processes",
                lazy: async () => {
                  const module = await import("@/features/processes/pages/processes-page");
                  return { Component: module.ProcessesPage };
                },
              },
              {
                path: "requests",
                lazy: async () => {
                  const module = await import("@/features/requests/pages/requests-page");
                  return { Component: module.RequestsPage };
                },
              },
              {
                path: "tasks",
                lazy: async () => {
                  const module = await import("@/features/tasks/pages/tasks-page");
                  return { Component: module.TasksPage };
                },
              },
              {
                path: "documents",
                lazy: async () => {
                  const module = await import("@/features/documents/pages/documents-page");
                  return { Component: module.DocumentsPage };
                },
              },
              {
                path: "requirements",
                lazy: async () => {
                  const module = await import("@/features/requirements/pages/requirements-page");
                  return { Component: module.RequirementsPage };
                },
              },
            ],
          },
        ],
      },
      {
        path: routes.developments,
        lazy: async () => {
          const module = await import("@/features/developments/pages/developments-page");
          return { Component: module.DevelopmentsPage };
        },
      },
      {
        path: routes.developmentRegistration,
        lazy: async () => {
          const module = await import("@/features/developments/pages/development-registration-page");
          return { Component: module.DevelopmentRegistrationPage };
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
        path: routes.buyers,
        lazy: async () => {
          const module = await import("@/features/buyers/pages/buyers-page");
          return { Component: module.BuyersPage };
        },
      },
      {
        path: routes.buyerDetail,
        lazy: async () => {
          const module = await import("@/features/buyers/pages/buyer-detail-page");
          return { Component: module.BuyerDetailPage };
        },
      },
      {
        path: routes.customers,
        lazy: async () => {
          const module = await import("@/features/customers/pages/customers-page");
          return { Component: module.CustomersPage };
        },
      },
      {
        path: routes.processes,
        lazy: async () => {
          const module = await import("@/features/processes/pages/processes-page");
          return { Component: module.ProcessesPage };
        },
      },
      {
        path: routes.developmentBuyerRegistration,
        lazy: async () => {
          const module = await import("@/features/buyers/pages/user-registration-page");
          return { Component: module.UserRegistrationPage };
        },
      },
      {
        path: routes.processDetail,
        lazy: async () => {
          const module = await import("@/features/processes/pages/process-detail-page");
          return { Component: module.ProcessDetailPage };
        },
      },
      {
        path: routes.requests,
        lazy: async () => {
          const module = await import("@/features/requests/pages/requests-page");
          return { Component: module.RequestsPage };
        },
      },
      {
        path: routes.tasks,
        lazy: async () => {
          const module = await import("@/features/tasks/pages/tasks-page");
          return { Component: module.TasksPage };
        },
      },
      {
        path: routes.documents,
        lazy: async () => {
          const module = await import("@/features/documents/pages/documents-page");
          return { Component: module.DocumentsPage };
        },
      },
      {
        path: routes.requirements,
        lazy: async () => {
          const module = await import("@/features/requirements/pages/requirements-page");
          return { Component: module.RequirementsPage };
        },
      },
      {
        path: routes.settings,
        lazy: async () => {
          const module = await import("@/features/settings/pages/settings-page");
          return { Component: module.SettingsPage };
        },
      },
      {
        path: routes.profile,
        lazy: async () => {
          const module = await import("@/features/profile/pages/profile-page");
          return { Component: module.ProfilePage };
        },
      },
      {
        path: routes.backofficeUsers,
        lazy: async () => {
          const module = await import("@/features/backoffice-users/pages/backoffice-users-page");
          return { Component: module.BackofficeUsersPage };
        },
      },
      {
        path: routes.customerDetail,
        lazy: async () => {
          const module = await import("@/features/customers/pages/customer-detail-page");
          return { Component: module.CustomerDetailPage };
        },
      },
      {
        path: routes.workflowList,
        lazy: async () => {
          const module = await import("@/features/workflows/pages/workflow-list-page");
          return { Component: module.WorkflowListPage };
        },
      },
      {
        path: routes.workflowSteps,
        lazy: async () => {
          const module = await import("@/features/workflows/pages/workflow-steps-page");
          return { Component: module.WorkflowStepsPage };
        },
      },
      {
        path: routes.workflowRules,
        lazy: async () => {
          const module = await import("@/features/workflows/pages/workflow-rules-page");
          return { Component: module.WorkflowRulesPage };
        },
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={routes.dashboard} replace />,
  },
]);
