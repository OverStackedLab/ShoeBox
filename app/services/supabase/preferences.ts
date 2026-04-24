import type { Currency } from "@/context/SettingsContext"

import { supabase } from "./supabase"

export interface UserPreferences {
  currency: Currency
}

export async function fetchUserPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("currency")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("fetchUserPreferences error:", error.message)
    return null
  }

  if (!data) return null

  return { currency: data.currency === "HUF" ? "HUF" : "USD" }
}

export async function upsertUserPreferences(userId: string, prefs: UserPreferences): Promise<void> {
  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      { user_id: userId, currency: prefs.currency, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    )

  if (error) {
    console.error("upsertUserPreferences error:", error.message)
  }
}
