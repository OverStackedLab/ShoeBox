# Supabase Setup

Infrastructure that the app expects to exist in the Supabase project. None of this lives in code, so it has to be configured in the Supabase Dashboard for each environment (dev, staging, prod).

## Storage buckets

### `avatars`

Used by [app/services/supabase/avatar.ts](../app/services/supabase/avatar.ts) to store user profile pictures at `{userId}/avatar.{png|jpg}`. The resulting public URL is written to `auth.users.user_metadata.avatar_url` and read back on app launch.

**Bucket config**

- Name: `avatars` (exact — `supabase.storage.from("avatars")` is hard-coded)
- Public bucket: **ON**. The app uses `getPublicUrl()` and `<Image src=...>`; without public access the URL returns HTTP 400 / 404 on the storage endpoint.

**Required RLS policies on `storage.objects`**

The upload uses `upsert: true`, so both INSERT and UPDATE policies are needed — without UPDATE, the second avatar upload silently fails.

```sql
-- Read: anyone can view (bucket is public)
create policy "Avatars are publicly readable"
on storage.objects for select
to public
using (bucket_id = 'avatars');

-- Insert: only into own folder
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Update: only own files (needed because upload uses upsert: true)
create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete: only own files
create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

### `receipt-images`

Used by [app/services/supabase/receipts.ts](../app/services/supabase/receipts.ts) to store scanned receipt photos at `{userId}/{receiptId}_{index}.jpg`. Unlike avatars, this bucket is **private** — the app accesses files via short-lived signed URLs and downloads them to the device's document directory for local rendering.

**Bucket config**

- Name: `receipt-images` (exact — referenced as `supabase.storage.from("receipt-images")`)
- Public bucket: **OFF**. Reads go through `createSignedUrl(path, 3600)`.

**Required RLS policies on `storage.objects`**

Upload uses `upsert: true`, so both INSERT and UPDATE are needed. SELECT is required because `createSignedUrl` is authorized against the same RLS as direct reads.

```sql
-- Read: only own files (used by createSignedUrl)
create policy "Users can read their own receipt images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'receipt-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Insert: only into own folder
create policy "Users can upload their own receipt images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'receipt-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Update: only own files (needed because upload uses upsert: true)
create policy "Users can update their own receipt images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'receipt-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'receipt-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete: only own files (used when a receipt is deleted)
create policy "Users can delete their own receipt images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'receipt-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

## Database tables

### `receipts`

Columns used by `upsertReceiptRemote` / `fetchRemoteReceipts`:

| Column       | Type                       | Notes                                  |
| ------------ | -------------------------- | -------------------------------------- |
| `id`         | `text` / `uuid` (PK)       | Client-generated receipt id            |
| `user_id`    | `uuid`                     | FK to `auth.users.id`                  |
| `store_name` | `text` (nullable)          |                                        |
| `date`       | `text` (nullable)          | ISO date string                        |
| `total`      | `numeric` (nullable)       |                                        |
| `category`   | `text` (nullable)          |                                        |
| `products`   | `jsonb` (nullable)         |                                        |
| `created_at` | `timestamptz`              | Set by client                          |

### `receipt_images`

| Column         | Type            | Notes                                                                    |
| -------------- | --------------- | ------------------------------------------------------------------------ |
| `receipt_id`   | FK → `receipts` | `on delete cascade` recommended (the app also deletes rows explicitly)   |
| `user_id`      | `uuid`          | FK to `auth.users.id`                                                    |
| `storage_path` | `text`          | Path in the `receipt-images` bucket, e.g. `{userId}/{receiptId}_0.jpg`   |
| `width`        | `int`           |                                                                          |
| `height`       | `int`           |                                                                          |
| `position`     | `int`           | Order of images for a multi-page receipt                                 |

Both tables need RLS enabled with policies restricting access to `auth.uid() = user_id`.

## Running migrations

Schema changes live in [supabase/migrations/](../supabase/migrations/). To apply pending migrations to the linked remote project:

```bash
supabase db push
```

### Authenticating the CLI

Newer CLI versions try to provision a temporary `cli_login_postgres` role and fail on hosted projects with `permission denied to alter role`. Work around it by passing the database password directly. Get it from Dashboard → **Project Settings → Database → Database password** (reset it there if you don't have it).

The CLI does **not** read the project's `.env`, so the password has to be in the shell environment when `supabase` runs. Pick one:

```bash
# One-off: load .env into the current shell, then push
set -a; source .env; set +a; supabase db push

# Or pass it inline
supabase db push --password "$SUPABASE_DB_PASSWORD"

# Or use direnv (brew install direnv) with .envrc → `dotenv .env`
```

Add the variable to `.env` (gitignored) — keep the name unprefixed so it isn't bundled into the Expo client:

```
SUPABASE_DB_PASSWORD=your-db-password-here
```

### "relation already exists" when pushing

If `supabase db push` errors with `relation "X" already exists (SQLSTATE 42P07)`, the table was created out-of-band (e.g. pasted into the SQL editor) before migrations were tracked. Mark the affected migrations as applied without re-running them:

```bash
supabase migration list                                              # see local vs remote state
supabase migration repair --status applied <timestamp> [<timestamp>...]
supabase db push                                                     # now only runs truly-new migrations
```

Only repair migrations whose schema actually exists on remote — repairing one whose tables aren't there will cause `db push` to silently skip it forever.

## Troubleshooting

### Avatar doesn't load after relaunch

Symptoms: image renders right after upload (because the local file URI is shown via `localAvatarUrl`), but on cold start the placeholder icon appears even though `user_metadata.avatar_url` is populated.

Diagnose by opening the URL from `user_metadata.avatar_url` in a browser:

- **`{ "error": "Bucket not found" }`** — the `avatars` bucket doesn't exist. Create it (see above).
- **HTTP 400 on the `/storage/v1/object/public/avatars/...` endpoint** — bucket exists but isn't marked public, _or_ the file isn't actually at that path. Check Dashboard → Storage → `avatars` for a folder named after the user's UUID. If the folder is empty, the client upload is failing silently.
- **HTTP 403** — bucket is public but RLS policies are missing/wrong. Re-apply the SQL above.

Note: `getPublicUrl()` is a pure URL builder — it returns a "valid-looking" URL even when the bucket doesn't exist or the upload failed, which is how a dead URL ends up persisted in `user_metadata`.

### Receipt images don't load after a fresh install / re-login

The app downloads receipt images to the device on first fetch and renders them from local files. If the local file is missing, it re-downloads via a signed URL. A signed-URL failure usually means:

- The `receipt-images` bucket doesn't exist, or its name doesn't match exactly.
- SELECT policy is missing on `storage.objects` for `receipt-images` (signed URLs respect RLS).
- The row's `storage_path` is wrong — it must be `{userId}/{receiptId}_{index}.jpg` to satisfy the `(storage.foldername(name))[1] = auth.uid()` check.
