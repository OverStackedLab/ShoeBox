import { createAnthropic } from "npm:@ai-sdk/anthropic@3.0.71"
import { generateObject } from "npm:ai@4.3.19"
import { createClient } from "npm:@supabase/supabase-js@2"
import { z } from "npm:zod@3.24.1"

interface CategoryInput {
  id: string
  label: string
  description?: string
}

interface RequestBody {
  text?: string
  storeName?: string
  total?: number
  items?: string[]
  categories: CategoryInput[]
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
)

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
    const { text, storeName, total, items, categories } = body

    if (!categories?.length) {
      return json({ error: "categories is required" }, 400)
    }

    const ids = categories.map((c) => c.id) as [string, ...string[]]

    const anthropic = createAnthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") })

    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5-20251001"),
      schema: z.object({
        categoryId: z.enum(ids),
        confidence: z.number().min(0).max(1),
      }),
      system:
        "You classify retail receipts into exactly one category from the provided list. " +
        "Prioritize the individual line items purchased — they are the strongest signal. " +
        "Use the store name and receipt text as supporting context. " +
        "If unsure, pick the category whose label most closely fits, or 'other' if present.",
      prompt: [
        `Available categories:\n${categories.map((c) => `- ${c.id}: ${c.label}${c.description ? ` — ${c.description}` : ""}`).join("\n")}`,
        storeName ? `Store: ${storeName}` : null,
        total != null ? `Total: ${total}` : null,
        items?.length ? `Items purchased:\n${items.join("\n")}` : null,
        text ? `Full receipt text:\n${text.slice(0, 3000)}` : null,
      ]
        .filter(Boolean)
        .join("\n\n"),
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
