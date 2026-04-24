const palette = {
  neutral100: "#000000",
  neutral200: "#1F1E1C", // slightly-elevated surface
  neutral300: "#141413", // background — warm near-black
  neutral400: "#2F2E2A", // border
  neutral500: "#4A4845", // tintInactive
  neutral600: "#6B6B66",
  neutral700: "#9B998F", // textDim
  neutral800: "#F5F3ED", // text — warm off-white
  neutral900: "#FFFFFF",

  brandOrange: "#E8981E", // lifted from light-mode #E8981E
  brandGreen: "#90C853", // lifted from #90C853
  brandRed: "#D64545", // lifted
  errorBg: "#3E1512",

  overlay20: "rgba(25, 16, 21, 0.2)",
  overlay50: "rgba(25, 16, 21, 0.5)",
} as const

export const colors = {
  palette,
  transparent: "rgba(0, 0, 0, 0)",
  text: palette.neutral800,
  textDim: palette.neutral700, // was neutral600 — fails contrast on dark bg
  background: palette.neutral300,
  border: palette.neutral400,
  tint: palette.brandOrange, // was accent300 (gold) — now matches light mode
  tintInactive: palette.neutral500, // was neutral400
  separator: palette.neutral400, // was neutral300 (invisible — same as bg)
  error: palette.brandRed,
  errorBackground: palette.errorBg,
  accent: palette.brandOrange,
  accentAlt: palette.brandGreen,
  destructive: palette.brandRed,
} as const
