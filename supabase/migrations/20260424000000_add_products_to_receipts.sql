alter table public.receipts
  add column if not exists products jsonb;
