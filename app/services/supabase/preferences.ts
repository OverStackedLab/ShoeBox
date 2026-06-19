import type { Currency } from "@/context/SettingsContext"

import { supabase } from "./supabase"

export interface UserPreferences {
  currency: Currency
  aiReceiptReading: boolean
}

export async function fetchUserPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("currency, ai_receipt_reading")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("fetchUserPreferences error:", error.message)
    return null
  }

  if (!data) return null

  return {
    currency: data.currency === "HUF" ? "HUF" : "USD",
    aiReceiptReading: data.ai_receipt_reading === true,
  }
}

export async function upsertUserPreferences(
  userId: string,
  prefs: Partial<UserPreferences>,
): Promise<void> {
  const row: Record<string, unknown> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  }
  if (prefs.currency !== undefined) row.currency = prefs.currency
  if (prefs.aiReceiptReading !== undefined) row.ai_receipt_reading = prefs.aiReceiptReading

  const { error } = await supabase.from("user_preferences").upsert(row, { onConflict: "user_id" })

  if (error) {
    console.error("upsertUserPreferences error:", error.message)
  }
}
