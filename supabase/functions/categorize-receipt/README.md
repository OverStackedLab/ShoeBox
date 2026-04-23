# categorize-receipt

Supabase Edge Function that takes raw OCR text from a scanned receipt and returns structured fields (`storeName`, `date`, `total`, `categoryId`, `confidence`, `products`) using Claude via the Vercel AI SDK.

## Deploying after changes

From the repo root:

```bash
supabase functions deploy categorize-receipt
```

That command picks up:

- Code changes in `index.ts`.
- The `verify_jwt = false` setting in [`supabase/config.toml`](../../config.toml) (this function does its own auth check via `supabase.auth.getUser(token)`, so the gateway's legacy-secret JWT verification is disabled).

If you haven't logged in / linked the project yet:

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

Your project ref is visible in the Supabase dashboard URL.

## Secrets

The function needs `ANTHROPIC_API_KEY`. Set it once (no redeploy required afterwards):

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected automatically by the platform.

## Checking logs

```bash
supabase functions logs categorize-receipt --tail
```

Trigger the function from the app (scan a receipt, or tap the magic-wand in the receipt detail header) and watch the stream. Each request has a unique `execution_id` — make sure you're reading a fresh one when debugging.

## Local invocation

To hit the deployed function directly:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/categorize-receipt" \
  -H "Authorization: Bearer <user-session-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "STORE NAME\n...raw OCR text...",
    "categories": [{ "id": "groceries", "label": "Groceries" }]
  }'
```

## Dependencies

Versioning is important — keep the AI SDK and provider in sync:

- `ai@5.x` uses provider spec v2.
- `@ai-sdk/anthropic@2.x` implements v2.

Bumping one without the other will throw `AI_UnsupportedModelVersionError` at runtime.
