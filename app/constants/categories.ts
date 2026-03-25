export const RECEIPT_CATEGORIES = [
  { key: "food", label: "Food & Dining", color: "#E8981E" },
  { key: "transport", label: "Transport", color: "#F5B041" },
  { key: "shopping", label: "Shopping", color: "#90C853" },
  { key: "entertainment", label: "Entertainment", color: "#D4780A" },
  { key: "health", label: "Health", color: "#5DADE2" },
  { key: "utilities", label: "Utilities", color: "#A569BD" },
  { key: "business", label: "Business", color: "#F0C060" },
  { key: "other", label: "Other", color: "#B6ACA6" },
] as const

export type ReceiptCategory = (typeof RECEIPT_CATEGORIES)[number]["key"]
