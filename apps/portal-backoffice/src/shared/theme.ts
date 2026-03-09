export const theme = {
  colors: {
    critical: {
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-100",
    },
    warning: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-100",
    },
    success: {
      bg: "bg-green-50",
      text: "text-green-600",
      border: "border-green-100",
    },
  },
  typography: {
    fontFamily: "Inter, -apple-system, sans-serif",
  },
} as const;

export type ThemeTokens = typeof theme;
