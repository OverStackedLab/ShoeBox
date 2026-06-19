import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect } from "react"
import { useMMKVBoolean, useMMKVString } from "react-native-mmkv"

import { fetchUserPreferences, upsertUserPreferences } from "@/services/supabase/preferences"

import { useAuth } from "./AuthContext"

export type Currency = "USD" | "HUF"

interface SettingsContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  /** When true, receipt fields are populated only by AI, skipping the local regex parser. */
  aiReceiptReading: boolean
  setAiReceiptReading: (enabled: boolean) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export const SettingsProvider: FC<PropsWithChildren> = ({ children }) => {
  const [currencyRaw, setCurrencyRaw] = useMMKVString("SettingsProvider.currency")
  const [aiReceiptReadingRaw, setAiReceiptReadingRaw] = useMMKVBoolean(
    "SettingsProvider.aiReceiptReading",
  )
  const { session } = useAuth()

  const currency: Currency = currencyRaw === "HUF" ? "HUF" : "USD"
  const aiReceiptReading = aiReceiptReadingRaw === true

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return

    fetchUserPreferences(userId).then((prefs) => {
      if (prefs) {
        setCurrencyRaw(prefs.currency)
        setAiReceiptReadingRaw(prefs.aiReceiptReading)
      }
    })
  }, [session?.user?.id])

  const setCurrency = useCallback(
    (c: Currency) => {
      setCurrencyRaw(c)
      const userId = session?.user?.id
      if (userId) {
        upsertUserPreferences(userId, { currency: c })
      }
    },
    [setCurrencyRaw, session?.user?.id],
  )

  const setAiReceiptReading = useCallback(
    (enabled: boolean) => {
      setAiReceiptReadingRaw(enabled)
      const userId = session?.user?.id
      if (userId) {
        upsertUserPreferences(userId, { aiReceiptReading: enabled })
      }
    },
    [setAiReceiptReadingRaw, session?.user?.id],
  )

  return (
    <SettingsContext.Provider
      value={{ currency, setCurrency, aiReceiptReading, setAiReceiptReading }}
    >
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
