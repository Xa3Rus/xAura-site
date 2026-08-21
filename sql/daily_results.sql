-- Результаты ежедневного челленджа.
-- Выполни этот скрипт в Supabase SQL Editor (Dashboard → SQL Editor → New query).

create table if not exists daily_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key text not null,             -- 'YYYY-MM-DD' в локальной зоне игрока
  mode text not null,                 -- 'battle' | 'screenshot'
  score int not null,                 -- 0..10
  created_at timestamptz not null default now(),
  unique (user_id, date_key)          -- одна попытка в день
);

alter table daily_results enable row level security;

-- игрок вставляет только свои результаты
drop policy if exists "daily insert own" on daily_results;
create policy "daily insert own"
  on daily_results for insert
  with check (auth.uid() = user_id);

-- таблица дня публична на чтение
drop policy if exists "daily public read" on daily_results;
create policy "daily public read"
  on daily_results for select
  using (true);

create index if not exists daily_results_date_idx on daily_results (date_key, score desc);
