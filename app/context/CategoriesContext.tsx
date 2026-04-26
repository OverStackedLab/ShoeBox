/**
 * CategoriesContext
 *
 * Built-in categories are fetched from the `default_categories` table in Supabase
 * (publicly readable, no auth required) and cached in MMKV. The hardcoded
 * RECEIPT_CATEGORIES array is used as an instant offline fallback.
 *
 * User-created categories are stored in `user_categories` (per-user, RLS-protected)
 * and cached in MMKV for offline use.
 *
 * ─── Supabase setup (run once in SQL editor) ────────────────────────────────
 *
 * create table user_categories (
 *   id         uuid primary key default gen_random_uuid(),
 *   user_id    uuid references auth.users not null,
 *   label      text not null,
 *   color      text not null,
 *   created_at timestamptz default now() not null
 * );
 * alter table user_categories enable row level security;
 * create policy "Users manage own categories"
 *   on user_categories for all
 *   using (auth.uid() = user_id)
 *   with check (auth.uid() = user_id);
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useMMKVString } from "react-native-mmkv"

import { RECEIPT_CATEGORIES } from "@/constants/categories"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/services/supabase/supabase"
import { storage } from "@/utils/storage"

const LEGACY_CUSTOM_CATEGORIES_KEY = "CategoriesProvider.customCategories"
const SIGNED_OUT_CUSTOM_CATEGORIES_KEY = "CategoriesProvider.customCategories.__signed_out__"

export interface Category {
  id: string
  label: string
  color: string
  description?: string
  isCustom: boolean
}

// Preset colors available when creating a new category
export const CATEGORY_COLORS = [
  "#E8981E",
  "#F5B041",
  "#90C853",
  "#5DADE2",
  "#A569BD",
  "#F0C060",
  "#D4780A",
  "#EC7063",
  "#48C9B0",
  "#5499C7",
  "#F1948A",
  "#B6ACA6",
]

const DESCRIPTION_BY_KEY = Object.fromEntries(RECEIPT_CATEGORIES.map((c) => [c.key, c.description]))

const BUILTIN_CATEGORIES: Category[] = RECEIPT_CATEGORIES.map((c) => ({
  id: c.key,
  label: c.label,
  color: c.color,
  description: c.description,
  isCustom: false,
}))

interface CategoriesContextType {
  categories: Category[]
  customCategories: Category[]
  isLoading: boolean
  addCategory: (label: string, color: string) => Promise<void>
  removeCategory: (id: string) => Promise<void>
}

const CategoriesContext = createContext<CategoriesContextType | null>(null)

export const CategoriesProvider: FC<PropsWithChildren> = ({ children }) => {
  const { session } = useAuth()
  const userId = session?.user?.id
  const [defaultCachedJson, setDefaultCachedJson] = useMMKVString(
    "CategoriesProvider.defaultCategories",
  )
  const customCacheKey = userId
    ? `CategoriesProvider.customCategories.${userId}`
    : SIGNED_OUT_CUSTOM_CATEGORIES_KEY
  const [customCachedJson, setCustomCachedJson] = useMMKVString(customCacheKey)
  const [isLoading, setIsLoading] = useState(false)

  // One-time wipe of any legacy unscoped cache from earlier app versions.
  useEffect(() => {
    if (storage.contains(LEGACY_CUSTOM_CATEGORIES_KEY)) {
      storage.delete(LEGACY_CUSTOM_CATEGORIES_KEY)
    }
  }, [])

  const defaultCategories = useMemo<Category[]>(() => {
    try {
      return defaultCachedJson ? JSON.parse(defaultCachedJson) : BUILTIN_CATEGORIES
    } catch {
      return BUILTIN_CATEGORIES
    }
  }, [defaultCachedJson])

  const customCategories = useMemo<Category[]>(() => {
    try {
      return customCachedJson ? JSON.parse(customCachedJson) : []
    } catch {
      return []
    }
  }, [customCachedJson])

  const categories = useMemo<Category[]>(
    () => [...defaultCategories, ...customCategories],
    [defaultCategories, customCategories],
  )

  // Fetch default categories from Supabase (no auth needed — public table)
  useEffect(() => {
    supabase
      .from("default_categories")
      .select("id, label, color")
      .order("position")
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) return
        const fetched: Category[] = data.map((row) => ({
          id: row.id as string,
          label: row.label as string,
          color: row.color as string,
          description: DESCRIPTION_BY_KEY[row.id as string],
          isCustom: false,
        }))
        setDefaultCachedJson(JSON.stringify(fetched))
      })
  }, [setDefaultCachedJson])

  // Fetch user-created categories from Supabase (requires auth)
  useEffect(() => {
    if (!session) return

    setIsLoading(true)
    supabase
      .from("user_categories")
      .select("id, label, color")
      .then(({ data, error }) => {
        setIsLoading(false)
        if (error || !data) return
        const fetched: Category[] = data.map((row) => ({
          id: row.id as string,
          label: row.label as string,
          color: row.color as string,
          isCustom: true,
        }))
        setCustomCachedJson(JSON.stringify(fetched))
      })
  }, [session, setCustomCachedJson])

  const addCategory = useCallback(
    async (label: string, color: string) => {
      if (!session) return

      const { data, error } = await supabase
        .from("user_categories")
        .insert({ label, color, user_id: session.user.id })
        .select("id, label, color")
        .single()

      if (error || !data) return

      const newCategory: Category = {
        id: data.id as string,
        label: data.label as string,
        color: data.color as string,
        isCustom: true,
      }
      setCustomCachedJson(JSON.stringify([...customCategories, newCategory]))
    },
    [session, customCategories, setCustomCachedJson],
  )

  const removeCategory = useCallback(
    async (id: string) => {
      if (!session) return

      const { error } = await supabase.from("user_categories").delete().eq("id", id)
      if (error) return

      setCustomCachedJson(JSON.stringify(customCategories.filter((c) => c.id !== id)))
    },
    [session, customCategories, setCustomCachedJson],
  )

  return (
    <CategoriesContext.Provider
      value={{ categories, customCategories, isLoading, addCategory, removeCategory }}
    >
      {children}
    </CategoriesContext.Provider>
  )
}

export const useCategories = () => {
  const context = useContext(CategoriesContext)
  if (!context) throw new Error("useCategories must be used within a CategoriesProvider")
  return context
}
