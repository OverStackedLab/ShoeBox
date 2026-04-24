const palette = {
  neutral900: "#FFFFFF",
  neutral800: "#F4F2F1",
  neutral700: "#959FA9",
  neutral600: "#6F7C89",
  neutral500: "#505963",
  neutral400: "#30363C",
  neutral300: "#111315",
  neutral200: "#191015",
  neutral100: "#000000",

  primary600: "#D9F0EE",
  primary500: "#A8DDD8",
  primary400: "#6FC2BA",
  primary300: "#3FA69C",
  primary200: "#1F857B",
  primary100: "#0F5E57",

  secondary500: "#DCDDE9",
  secondary400: "#BCC0D6",
  secondary300: "#9196B9",
  secondary200: "#626894",
  secondary100: "#41476E",

  accent500: "#FFEED4",
  accent400: "#FFE1B2",
  accent300: "#FDD495",
  accent200: "#FBC878",
  accent100: "#FFBB50",

  angry100: "#F2D6CD",
  angry500: "#C03403",

  brandOrange: "#E8981E",
  brandGreen: "#90c853",
  brandRed: "#FF3B30",

  overlay20: "rgba(25, 16, 21, 0.2)",
  overlay50: "rgba(25, 16, 21, 0.5)",
} as const

export const colors = {
  palette,
  transparent: "rgba(0, 0, 0, 0)",
  text: palette.neutral800,
  textDim: palette.neutral600,
  background: palette.neutral300,
  border: palette.neutral400,
  tint: palette.accent300,
  tintInactive: palette.neutral400,
  separator: palette.neutral300,
  error: palette.angry500,
  errorBackground: palette.angry100,
  accent: palette.brandOrange,
  accentAlt: palette.brandGreen,
  destructive: palette.brandRed,
} as const
