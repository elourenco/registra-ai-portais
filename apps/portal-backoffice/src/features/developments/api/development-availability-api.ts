import { availabilityListResponseSchema, type AvailabilityListResponse } from "@registra/shared";

import { apiRequest } from "@/shared/api/http-client";

interface GetDevelopmentAvailabilityParams {
  developmentId: string;
  token: string;
}

export async function getDevelopmentAvailability({
  developmentId,
  token,
}: GetDevelopmentAvailabilityParams): Promise<AvailabilityListResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/developments/${encodeURIComponent(developmentId)}/availability`,
    {
      token,
      method: "GET",
    },
  );

  return availabilityListResponseSchema.parse(response);
}
