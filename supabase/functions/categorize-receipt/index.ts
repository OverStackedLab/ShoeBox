import { createAnthropic } from "npm:@ai-sdk/anthropic@2.0.0"
import { createClient } from "npm:@supabase/supabase-js@2"
import { generateObject } from "npm:ai@5.0.0"
import { z } from "npm:zod@3.24.1"

interface CategoryInput {
  id: string
  label: string
  description?: string
}

interface RequestBody {
  text?: string
  categories: CategoryInput[]
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!)

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const token = req.headers.get("Authorization")?.replace("Bearer ", "")
  if (!token) return json({ error: "missing authorization header" }, 401)

  const { error: authError } = await supabase.auth.getUser(token)
  if (authError) return json({ error: "unauthorized" }, 401)

  try {
    const body = (await req.json()) as RequestBody
    const { text, categories } = body

    if (!categories?.length) {
      return json({ error: "categories is required" }, 400)
    }
    if (!text?.trim()) {
      return json({ error: "text is required" }, 400)
    }

    const ids = categories.map((c) => c.id) as [string, ...string[]]

    const anthropic = createAnthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") })

    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5-20251001"),
      schema: z.object({
        storeName: z.string().optional(),
        date: z.string().optional(),
        total: z.number().optional(),
        categoryId: z.enum(ids),
        confidence: z.number().min(0).max(1),
        products: z.array(
          z.object({
            name: z.string(),
            price: z.number().optional(),
          }),
        ),
      }),
      system:
        "You parse retail receipts from raw OCR text. Extract structured fields and classify " +
        "the receipt into exactly one category from the provided list.\n\n" +
        "Fields:\n" +
        "- storeName: the merchant / store name as it appears on the receipt. Omit if you cannot find it.\n" +
        "- date: the purchase date in ISO format YYYY-MM-DD. Omit if you cannot find or infer one.\n" +
        "- total: the final total amount paid, as a number (no currency symbol). Prefer the grand total over subtotal. Omit if not present.\n" +
        "- categoryId: one of the provided category ids. Prioritize the individual line items purchased — they are the strongest signal. Use store name as supporting context. If unsure, pick the closest fit, or 'other' if present.\n" +
        "- confidence: 0-1 confidence in the category.\n" +
        "- products: clean list of item names as they appear on the receipt, with unit price when available. Exclude subtotals, taxes, discounts, tips, totals, and payment/tender lines. Return an empty array if no products can be identified.",
      prompt: [
        `Available categories:\n${categories.map((c) => `- ${c.id}: ${c.label}${c.description ? ` — ${c.description}` : ""}`).join("\n")}`,
        `Receipt OCR text:\n${text}`,
      ].join("\n\n"),
    })

    return json(object)
  } catch (err) {
    console.error(err)
    return json({ error: err instanceof Error ? err.message : "unknown error" }, 500)
  }
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
