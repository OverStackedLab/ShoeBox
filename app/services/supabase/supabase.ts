import { createClient } from "@supabase/supabase-js"

import { loadString, saveString, remove } from "@/utils/storage"

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ""
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? ""

const MMKVStorageAdapter = {
  getItem: (key: string) => loadString(key),
  setItem: (key: string, value: string) => {
    saveString(key, value)
  },
  removeItem: (key: string) => {
    remove(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: MMKVStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
