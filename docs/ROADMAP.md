# ShoeBox Roadmap Ideas

Potential features and upgrades for turning ShoeBox from a receipt scanner into a more complete
expense tool.

## High-value product upgrades

### Manual receipt entry

Allow users to add a receipt without scanning: merchant, date, total, category, products, and
optional notes. This covers online purchases, old expenses, bad scans, and cases where camera
access is unavailable.

### Receipt search and filters

Add search by merchant or product, plus filters for category, date range, and amount. This becomes
increasingly important once users have a real receipt history.

### Monthly budget tracking

Support category-level monthly budgets with progress indicators and warning states when spending
approaches or exceeds a limit.

### Better receipt detail editing

Replace `Alert.prompt` edits with an in-app edit mode or bottom sheet. This would feel more native,
work better across platforms, and make product/field editing easier to review.

### AI receipt cleanup

Add an "AI fix" flow that reprocesses OCR text and presents suggested corrections for merchant,
date, total, products, and category before applying them.

### Product-level analytics

Use extracted `products` to show top purchased items, repeated purchases, price changes, or where a
product was last bought.

## Product polish

### Receipt image gallery and multi-page support

The data model supports multiple images, but the current scan flow keeps one image. Multi-page
receipt support would help with long receipts and invoices.

### Export receipts

Export CSV or PDF reports for a date range, category, merchant, or tax/business expense workflow.

### Merchant summaries

Detect recurring merchants and show merchant-level totals, such as monthly spend at a specific
store.

### Category rules

Let users create deterministic rules like "If merchant contains Costco, categorize as Groceries."
This reduces AI dependence and makes categorization predictable.

### Import from photo library

Support choosing a receipt image from the photo library in addition to live scanning.

### Notifications

Use the existing bell affordance for budget alerts, uncategorized receipt reminders, failed sync
warnings, or weekly spending summaries.

## Engineering upgrades

### Correctness backlog from recent review

- **Priority: P1** — Migrate legacy unscoped receipt cache before deleting it. Existing local-only receipts
  can be lost on upgrade if `ReceiptsProvider.receipts` is wiped before being copied into the new
  signed-out or user-scoped cache key.
- **Priority: P1** — Migrate legacy unscoped custom category cache before deleting it. Existing custom
  categories can be lost on upgrade if `CategoriesProvider.customCategories` is wiped before being
  copied into the new signed-out or user-scoped cache key.
- **Priority: P1** — Normalize the `createdAt` / `created_at` boundary. The app creates receipts with
  `Date.now()` epoch millis while Supabase defines `receipts.created_at` as `timestamptz`, and
  fetched rows come back as strings.
- **Priority: P2** — Configure iOS photo-library permissions for avatar picking. Add the `expo-image-picker`
  config plugin with photo permission copy, or add the matching `NSPhotoLibraryUsageDescription`
  plist entry.

### Sync status and retry queue

Show whether a receipt is local-only, syncing, synced, or failed. Queue failed uploads and retry
when connectivity returns.

### Complete Supabase migrations

Add fresh-project migrations for `receipts`, `receipt_images`, `user_categories`, storage buckets,
and RLS policies so a new environment can be created from source control alone.

### Visual regression coverage

Add screenshot tests for key screens, empty states, dark mode, and receipt detail flows to catch
layout regressions before release.

## Suggested build order

1. Receipt search and filters
2. Manual receipt entry
3. Monthly budget tracking
4. Better receipt detail editing
5. Sync status and retry queue
