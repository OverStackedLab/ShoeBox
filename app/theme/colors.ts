const palette = {
  neutral100: "#FFFFFF",
  neutral200: "#FAFAF7", // warm off-white — background
  neutral300: "#EEECE5", // separator
  neutral400: "#D4D2CA", // border
  neutral500: "#9B998F", // tintInactive
  neutral600: "#6B6B66", // textDim
  neutral700: "#3C3A36",
  neutral800: "#1A1A1A", // text
  neutral900: "#000000",

  brandOrange: "#E8981E",
  brandGreen: "#90C853",
  brandRed: "#D64545", // desaturated to sit with the warm palette
  errorBg: "#FAE5E1", // soft red fill for error banners

  overlay20: "rgba(25, 16, 21, 0.2)",
  overlay50: "rgba(25, 16, 21, 0.5)",
} as const

export const colors = {
  palette,
  transparent: "rgba(0, 0, 0, 0)",
  text: palette.neutral800,
  textDim: palette.neutral600,
  background: palette.neutral200, // was neutral100 (pure white)
  border: palette.neutral400,
  tint: palette.brandOrange, // was primary500 (teal)
  tintInactive: palette.neutral500, // was neutral300
  separator: palette.neutral300,
  error: palette.brandRed, // was angry500
  errorBackground: palette.errorBg, // was angry100
  accent: palette.brandOrange,
  accentAlt: palette.brandGreen,
  destructive: palette.brandRed,
} as const
