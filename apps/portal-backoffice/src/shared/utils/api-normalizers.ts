export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function pickText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(Math.trunc(value));
    }
  }

  return null;
}

export function pickNumber(fallback: number, ...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.trunc(value);
    }

    if (typeof value === "string") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return Math.trunc(parsed);
      }
    }
  }

  return fallback;
}

export function pickBoolean(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}
