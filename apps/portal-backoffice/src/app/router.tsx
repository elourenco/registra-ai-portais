import { createBrowserRouter, Navigate } from "react-router-dom";

import { ProtectedLayout } from "@/app/layouts/protected-layout";
import { routes } from "@/shared/constants/routes";

export const router = createBrowserRouter([
  {
    path: routes.login,
    lazy: async () => {
      const module = await import("@/features/auth/pages/login-page");
      return { Component: module.LoginPage };
    },
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
        lazy: async () => {
          const module = await import("@/features/dashboard/pages/dashboard-page");
          return { Component: module.DashboardPage };
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
        path: routes.customerDetail,
        lazy: async () => {
          const module = await import("@/features/customers/pages/customer-detail-page");
          return { Component: module.CustomerDetailPage };
        },
      },
      {
        path: routes.suppliers,
        lazy: async () => {
          const module = await import("@/features/suppliers/pages/suppliers-page");
          return { Component: module.SuppliersPage };
        },
      },
      {
        path: routes.supplierDetail,
        lazy: async () => {
          const module = await import("@/features/suppliers/pages/supplier-detail-page");
          return { Component: module.SupplierDetailPage };
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
      {
        path: routes.profile,
        lazy: async () => {
          const module = await import("@/features/profile/pages/profile-page");
          return { Component: module.ProfilePage };
        },
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={routes.dashboard} replace />,
  },
]);
