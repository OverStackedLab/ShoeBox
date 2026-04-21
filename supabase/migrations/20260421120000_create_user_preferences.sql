create table if not exists public.user_preferences (
  user_id text primary key,
  currency text not null default 'USD',
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can read their own preferences"
  on public.user_preferences for select
  using (auth.uid()::text = user_id);

create policy "Users can upsert their own preferences"
  on public.user_preferences for insert
  with check (auth.uid()::text = user_id);

create policy "Users can update their own preferences"
  on public.user_preferences for update
  using (auth.uid()::text = user_id);
