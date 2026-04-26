-- Idempotent setup for the core per-user tables: receipts, receipt_images,
-- user_categories. Safe to run on a fresh project or re-run on an existing one.

-- receipts -------------------------------------------------------------------
create table if not exists receipts (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  store_name  text,
  date        text,
  total       numeric,
  category    text,
  products    jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists receipts_user_id_idx on receipts (user_id);
create index if not exists receipts_user_created_idx on receipts (user_id, created_at desc);

alter table receipts enable row level security;

drop policy if exists "Users manage own receipts" on receipts;
create policy "Users manage own receipts"
  on receipts for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- receipt_images -------------------------------------------------------------
create table if not exists receipt_images (
  id            uuid primary key default gen_random_uuid(),
  receipt_id    text not null references receipts (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  storage_path  text not null,
  width         int not null,
  height        int not null,
  position      int not null default 0
);

create index if not exists receipt_images_receipt_id_idx on receipt_images (receipt_id);
create index if not exists receipt_images_user_id_idx on receipt_images (user_id);

alter table receipt_images enable row level security;

drop policy if exists "Users manage own receipt images" on receipt_images;
create policy "Users manage own receipt images"
  on receipt_images for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_categories ------------------------------------------------------------
create table if not exists user_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  label       text not null,
  color       text not null,
  created_at  timestamptz not null default now()
);

create index if not exists user_categories_user_id_idx on user_categories (user_id);

alter table user_categories enable row level security;

drop policy if exists "Users manage own categories" on user_categories;
create policy "Users manage own categories"
  on user_categories for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
