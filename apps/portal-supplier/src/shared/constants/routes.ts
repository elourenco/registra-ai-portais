export const routes = {
  onboarding: "/onboarding",
  supplierSignup: "/onboarding/signup",
  login: "/login",
  dashboard: "/dashboard",
  developments: "/developments",
  developmentCreate: "/developments/new",
  developmentDetail: "/developments/:developmentId",
  developmentBuyerCreate: "/developments/:developmentId/buyers/new",
  developmentDetailById: (developmentId: string) => `/developments/${developmentId}`,
  developmentBuyerCreateById: (developmentId: string) => `/developments/${developmentId}/buyers/new`,
} as const;
