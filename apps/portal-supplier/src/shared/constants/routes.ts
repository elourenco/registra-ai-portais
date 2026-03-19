export const routes = {
  onboarding: "/onboarding",
  supplierSignup: "/onboarding/signup",
  login: "/login",
  dashboard: "/dashboard",
  developments: "/developments",
  developmentCreate: "/developments/new",
  developmentDetail: "/developments/:developmentId",
  developmentProcessDetail: "/developments/:developmentId/processes/:processId",
  developmentAvailability: "/developments/:developmentId/availability",
  developmentBuyerCreate: "/developments/:developmentId/buyers/new",
  developmentBuyerDetail: "/developments/:developmentId/buyers/:buyerId",
  developmentDetailById: (developmentId: string) => `/developments/${developmentId}`,
  developmentProcessDetailById: (developmentId: string, processId: string) =>
    `/developments/${developmentId}/processes/${processId}`,
  developmentAvailabilityById: (developmentId: string) => `/developments/${developmentId}/availability`,
  developmentBuyerCreateById: (developmentId: string) => `/developments/${developmentId}/buyers/new`,
  developmentBuyerDetailById: (developmentId: string, buyerId: string) =>
    `/developments/${developmentId}/buyers/${buyerId}`,
} as const;
