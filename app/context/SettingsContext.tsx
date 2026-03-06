import { createContext, FC, PropsWithChildren, useCallback, useContext } from "react"
import { useMMKVString } from "react-native-mmkv"

export type Currency = "USD" | "HUF"

interface SettingsContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export const SettingsProvider: FC<PropsWithChildren> = ({ children }) => {
  const [currencyRaw, setCurrencyRaw] = useMMKVString("SettingsProvider.currency")

  const currency: Currency = currencyRaw === "HUF" ? "HUF" : "USD"

  const setCurrency = useCallback((c: Currency) => setCurrencyRaw(c), [setCurrencyRaw])

  return (
    <SettingsContext.Provider value={{ currency, setCurrency }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) throw new Error("useSettings must be used within a SettingsProvider")
  return context
}

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === "HUF") {
    const rounded = Math.round(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    return `${rounded} Ft`
  }
  return `$${amount.toFixed(2)}`
}
