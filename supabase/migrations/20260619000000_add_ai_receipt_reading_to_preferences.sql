alter table public.user_preferences
  add column if not exists ai_receipt_reading boolean not null default false;
