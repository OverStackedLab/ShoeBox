/**
 * CategoriesContext
 *
 * Built-in categories come from the `default_categories` table in Supabase
 * (publicly readable, no auth required). The hardcoded RECEIPT_CATEGORIES array
 * is used as an instant offline fallback until Supabase responds.
 *
 * User-created categories are stored in `user_categories` (per-user, RLS-protected)
 * and cached in MMKV for offline use.
 *
 * ─── Supabase setup (run once in SQL editor) ────────────────────────────────
 *
 * -- Default categories (shared, publicly readable)
 * create table default_categories (
 *   id       text primary key,
 *   label    text not null,
 *   color    text not null,
 *   position smallint not null default 0
 * );
 * grant select on default_categories to anon, authenticated;
 *
 * insert into default_categories (id, label, color, position) values
 *   ('food',          'Food & Dining',  '#E8981E', 0),
 *   ('transport',     'Transport',      '#F5B041', 1),
 *   ('shopping',      'Shopping',       '#90C853', 2),
 *   ('entertainment', 'Entertainment',  '#D4780A', 3),
 *   ('health',        'Health',         '#5DADE2', 4),
 *   ('utilities',     'Utilities',      '#A569BD', 5),
 *   ('business',      'Business',       '#F0C060', 6),
 *   ('other',         'Other',          '#B6ACA6', 7);
 *
 * -- User-created categories (private, RLS-protected)
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
import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useMMKVString } from "react-native-mmkv"

import { RECEIPT_CATEGORIES } from "@/constants/categories"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/services/supabase/supabase"

export interface Category {
  id: string
  label: string
  color: string
  isCustom: boolean
}

// Preset colors available when creating a new category
export const CATEGORY_COLORS = [
  "#E8981E", "#F5B041", "#90C853", "#5DADE2",
  "#A569BD", "#F0C060", "#D4780A", "#EC7063",
  "#48C9B0", "#5499C7", "#F1948A", "#B6ACA6",
]

// Hardcoded fallback used instantly while Supabase loads
const FALLBACK_CATEGORIES: Category[] = RECEIPT_CATEGORIES.map((c) => ({
  id: c.key,
  label: c.label,
  color: c.color,
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
  const [defaultCachedJson, setDefaultCachedJson] = useMMKVString("CategoriesProvider.defaultCategories")
  const [customCachedJson, setCustomCachedJson] = useMMKVString("CategoriesProvider.customCategories")
  const [isLoading, setIsLoading] = useState(false)

  const defaultCategories = useMemo<Category[]>(() => {
    try {
      return defaultCachedJson ? JSON.parse(defaultCachedJson) : FALLBACK_CATEGORIES
    } catch {
      return FALLBACK_CATEGORIES
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
    <CategoriesContext.Provider value={{ categories, customCategories, isLoading, addCategory, removeCategory }}>
      {children}
    </CategoriesContext.Provider>
  )
}

export const useCategories = () => {
  const context = useContext(CategoriesContext)
  if (!context) throw new Error("useCategories must be used within a CategoriesProvider")
  return context
}
