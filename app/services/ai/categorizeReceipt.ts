import { supabase } from "@/services/supabase/supabase"

interface CategorizeInput {
  text?: string
  storeName?: string
  total?: number
  items?: string[]
  categories: { id: string; label: string; description?: string }[]
}

interface CategorizeResult {
  categoryId: string
  confidence: number
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
