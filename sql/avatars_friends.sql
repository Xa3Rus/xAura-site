-- Аватарки и система друзей.
-- Выполни этот скрипт в Supabase SQL Editor (Dashboard → SQL Editor → New query).

-- 1. Аватар в профиле
alter table profiles add column if not exists avatar_url text;

-- 2. Публичный bucket для аватаров
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Чтение — всем (bucket публичный, но политика не помешает)
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Запись — только в свою папку avatars/{uid}/...
drop policy if exists "avatars own upload" on storage.objects;
create policy "avatars own upload"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text);

-- Обновление/удаление — только своих файлов
drop policy if exists "avatars own update" on storage.objects;
create policy "avatars own update"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars own delete" on storage.objects;
create policy "avatars own delete"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Друзья
create table if not exists friendships (
  id bigint generated always as identity primary key,
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',   -- 'pending' | 'accepted'
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

alter table friendships enable row level security;

-- читать дружбу могут только участники
drop policy if exists "friends read" on friendships;
create policy "friends read"
  on friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- отправить заявку может только отправитель
drop policy if exists "friends insert own request" on friendships;
create policy "friends insert own request"
  on friendships for insert
  with check (auth.uid() = requester_id);

-- принять/отклонить может только адресат
drop policy if exists "friends respond" on friendships;
create policy "friends respond"
  on friendships for update
  using (auth.uid() = addressee_id);

-- удалить связь может любой из пары (отменить заявку / убрать из друзей)
drop policy if exists "friends delete" on friendships;
create policy "friends delete"
  on friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create index if not exists friendships_requester_idx on friendships (requester_id, status);
create index if not exists friendships_addressee_idx on friendships (addressee_id, status);
