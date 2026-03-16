import {
  availabilityItemSchema,
  availabilityListResponseSchema,
  createAvailabilityItemInputSchema,
  generateAvailabilityInputSchema,
  updateAvailabilityItemInputSchema,
  type AvailabilityItem,
  type AvailabilityListResponse,
  type CreateAvailabilityItemInput,
  type GenerateAvailabilityInput,
  type UpdateAvailabilityItemInput,
} from "@registra/shared";

import { apiRequest } from "@/shared/api/http-client";

interface GetDevelopmentAvailabilityInput {
  developmentId: string;
  token: string;
  search?: string;
}

interface GenerateDevelopmentAvailabilityParams {
  developmentId: string;
  token: string;
  input: GenerateAvailabilityInput;
}

interface CreateAvailabilityItemParams {
  developmentId: string;
  token: string;
  input: CreateAvailabilityItemInput;
}

interface UpdateAvailabilityItemParams {
  developmentId: string;
  itemId: string;
  token: string;
  input: UpdateAvailabilityItemInput;
}

interface DeleteAvailabilityItemParams {
  developmentId: string;
  itemId: string;
  token: string;
}

function resolveDevelopmentAvailabilityPath(developmentId: string): string {
  return `/api/v1/developments/${encodeURIComponent(developmentId)}/availability`;
}

function resolveDevelopmentAvailabilityItemPath(developmentId: string, itemId: string): string {
  return `${resolveDevelopmentAvailabilityPath(developmentId)}/${encodeURIComponent(itemId)}`;
}

export async function getDevelopmentAvailability({
  developmentId,
  token,
  search,
}: GetDevelopmentAvailabilityInput): Promise<AvailabilityListResponse> {
  const searchParams = new URLSearchParams();

  if (search?.trim()) {
    searchParams.set("search", search.trim());
  }

  const path = `${resolveDevelopmentAvailabilityPath(developmentId)}${
    searchParams.size > 0 ? `?${searchParams.toString()}` : ""
  }`;
  const response = await apiRequest<unknown>(path, {
    token,
    method: "GET",
  });

  return availabilityListResponseSchema.parse(response);
}

export async function generateDevelopmentAvailability({
  developmentId,
  token,
  input,
}: GenerateDevelopmentAvailabilityParams): Promise<AvailabilityListResponse> {
  const parsedInput = generateAvailabilityInputSchema.parse(input);
  const response = await apiRequest<unknown>(
    `${resolveDevelopmentAvailabilityPath(developmentId)}/generate`,
    {
      token,
      method: "POST",
      body: JSON.stringify(parsedInput),
    },
  );

  return availabilityListResponseSchema.parse(response);
}

export async function createAvailabilityItem({
  developmentId,
  token,
  input,
}: CreateAvailabilityItemParams): Promise<AvailabilityItem> {
  const parsedInput = createAvailabilityItemInputSchema.parse(input);
  const response = await apiRequest<unknown>(resolveDevelopmentAvailabilityPath(developmentId), {
    token,
    method: "POST",
    body: JSON.stringify(parsedInput),
  });

  return availabilityItemSchema.parse(response);
}

export async function updateAvailabilityItem({
  developmentId,
  itemId,
  token,
  input,
}: UpdateAvailabilityItemParams): Promise<AvailabilityItem> {
  const parsedInput = updateAvailabilityItemInputSchema.parse(input);
  const response = await apiRequest<unknown>(
    resolveDevelopmentAvailabilityItemPath(developmentId, itemId),
    {
      token,
      method: "PATCH",
      body: JSON.stringify(parsedInput),
    },
  );

  return availabilityItemSchema.parse(response);
}

export async function deleteAvailabilityItem({
  developmentId,
  itemId,
  token,
}: DeleteAvailabilityItemParams): Promise<void> {
  await apiRequest<unknown>(resolveDevelopmentAvailabilityItemPath(developmentId, itemId), {
    token,
    method: "DELETE",
  });
}
