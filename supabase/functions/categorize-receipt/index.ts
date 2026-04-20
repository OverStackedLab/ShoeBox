import { createAnthropic } from "npm:@ai-sdk/anthropic@1.2.12"
import { generateObject } from "npm:ai@4.3.19"
import { z } from "npm:zod@3.24.1"

interface CategoryInput {
  id: string
  label: string
}

interface RequestBody {
  text?: string
  storeName?: string
  total?: number
  categories: CategoryInput[]
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as RequestBody
    const { text, storeName, total, categories } = body

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
        "Pick the single best match based on the store name and receipt contents. " +
        "If unsure, pick the category whose label most closely fits, or 'other' if present.",
      prompt: [
        `Available categories: ${categories.map((c) => `${c.id} (${c.label})`).join(", ")}`,
        storeName ? `Store: ${storeName}` : null,
        total != null ? `Total: ${total}` : null,
        text ? `Receipt text:\n${text.slice(0, 4000)}` : null,
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
