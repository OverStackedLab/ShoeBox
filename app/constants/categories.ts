export const RECEIPT_CATEGORIES = [
  {
    key: "groceries",
    label: "Groceries",
    description: "Supermarkets, grocery stores, food delivery, farmers markets",
    color: "#E8981E",
  },
  {
    key: "dining",
    label: "Dining",
    description: "Restaurants, cafes, bars, takeaway, fast food",
    color: "#F07030",
  },
  {
    key: "transport",
    label: "Transport",
    description: "Fuel, parking, public transit, taxis, ride-sharing, tolls, vehicle maintenance",
    color: "#F5B041",
  },
  {
    key: "shopping",
    label: "Shopping",
    description: "Clothing, electronics, home goods, department stores, online retail (non-food)",
    color: "#90C853",
  },
  {
    key: "entertainment",
    label: "Entertainment",
    description: "Cinema, concerts, sports events, streaming, games, hobbies",
    color: "#D4780A",
  },
  {
    key: "health",
    label: "Health",
    description: "Pharmacy, doctor, dentist, gym, wellness, medical supplies",
    color: "#5DADE2",
  },
  {
    key: "utilities",
    label: "Utilities",
    description: "Electricity, gas, water, internet, phone, insurance",
    color: "#A569BD",
  },
  {
    key: "business",
    label: "Business",
    description: "Office supplies, software, professional services, work travel",
    color: "#F0C060",
  },
  { key: "other", label: "Other", description: "Anything that doesn't fit the above", color: "#B6ACA6" },
] as const

export type ReceiptCategory = (typeof RECEIPT_CATEGORIES)[number]["key"]
