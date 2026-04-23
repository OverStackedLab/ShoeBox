import { supabase } from "@/services/supabase/supabase"

interface CategorizeInput {
  text: string
  categories: { id: string; label: string; description?: string }[]
}

export interface CategorizedProduct {
  name: string
  price?: number | null
}

export interface CategorizeResult {
  storeName?: string
  date?: string
  total?: number
  categoryId: string
  confidence: number
  products: CategorizedProduct[]
}

export async function categorizeReceipt(input: CategorizeInput): Promise<CategorizeResult | null> {
  const { data, error } = await supabase.functions.invoke<CategorizeResult>("categorize-receipt", {
    body: input,
  })
  if (error || !data) {
    console.error("categorizeReceipt failed", error)
    return null
  }
  return data
}
