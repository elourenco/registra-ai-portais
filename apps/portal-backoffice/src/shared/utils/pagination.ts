interface PaginationLike {
  limit: number;
  page: number;
  totalItems: number;
}

export interface PaginationSummary {
  endItem: number;
  startItem: number;
  totalItems: number;
}

export function getPaginationSummary(
  pagination: PaginationLike | null | undefined,
  fallbackCount: number,
): PaginationSummary {
  if (!pagination || pagination.totalItems <= 0) {
    return {
      startItem: 0,
      endItem: 0,
      totalItems: fallbackCount,
    };
  }

  return {
    startItem: (pagination.page - 1) * pagination.limit + 1,
    endItem: Math.min(pagination.page * pagination.limit, pagination.totalItems),
    totalItems: pagination.totalItems,
  };
}
