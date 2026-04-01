const PT_BR_LOCALE = "pt-BR";

const relativeTimeFormatter = new Intl.RelativeTimeFormat(PT_BR_LOCALE, {
  numeric: "auto",
});

type DateFormatOptions = Intl.DateTimeFormatOptions;

function toValidDate(value: string | Date): Date | null {
  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function formatPtBrDate(value: string | Date, options?: DateFormatOptions): string {
  const parsed = toValidDate(value);

  if (!parsed) {
    return "-";
  }

  return new Intl.DateTimeFormat(PT_BR_LOCALE, options).format(parsed);
}

export function formatRelativeTimeToNow(value: string | Date): string {
  const parsed = toValidDate(value);

  if (!parsed) {
    return "-";
  }

  const diffInSeconds = Math.round((parsed.getTime() - Date.now()) / 1000);
  const absoluteDiffInSeconds = Math.abs(diffInSeconds);

  if (absoluteDiffInSeconds < 60) {
    return relativeTimeFormatter.format(diffInSeconds, "second");
  }

  const diffInMinutes = Math.round(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) {
    return relativeTimeFormatter.format(diffInMinutes, "minute");
  }

  const diffInHours = Math.round(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return relativeTimeFormatter.format(diffInHours, "hour");
  }

  const diffInDays = Math.round(diffInHours / 24);
  if (Math.abs(diffInDays) < 30) {
    return relativeTimeFormatter.format(diffInDays, "day");
  }

  const diffInMonths = Math.round(diffInDays / 30);
  if (Math.abs(diffInMonths) < 12) {
    return relativeTimeFormatter.format(diffInMonths, "month");
  }

  const diffInYears = Math.round(diffInMonths / 12);
  return relativeTimeFormatter.format(diffInYears, "year");
}
