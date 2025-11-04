-- Migrações para habilitar CRUD de imagens e autenticação
-- Execute este arquivo no SQL Editor do seu projeto Supabase

-- 1) Tabela de portfólio
create table if not exists public.portfolio (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  type text check (type in ('image','video')) not null,
  url text,
  tags text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger para manter updated_at atualizado
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.portfolio;
create trigger set_updated_at before update on public.portfolio
for each row execute function public.set_updated_at();

-- 2) Ativar RLS e políticas
alter table public.portfolio enable row level security;

-- Leitura pública
drop policy if exists "public_read_portfolio" on public.portfolio;
create policy "public_read_portfolio" on public.portfolio
  for select using (true);

-- Inserção pelo dono autenticado
drop policy if exists "owner_insert_portfolio" on public.portfolio;
create policy "owner_insert_portfolio" on public.portfolio
  for insert with check (auth.uid() = user_id);

-- Atualização pelo dono autenticado
drop policy if exists "owner_update_portfolio" on public.portfolio;
create policy "owner_update_portfolio" on public.portfolio
  for update using (auth.uid() = user_id);

-- Exclusão pelo dono autenticado
drop policy if exists "owner_delete_portfolio" on public.portfolio;
create policy "owner_delete_portfolio" on public.portfolio
  for delete using (auth.uid() = user_id);

-- 3) Bucket de storage para mídias
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Políticas do bucket 'media'
-- Leitura pública de objetos do bucket
drop policy if exists "public_read_media" on storage.objects;
create policy "public_read_media" on storage.objects
  for select using (bucket_id = 'media');

-- Upload apenas para usuários autenticados
drop policy if exists "auth_insert_media" on storage.objects;
create policy "auth_insert_media" on storage.objects
  for insert with check (bucket_id = 'media' and auth.uid() is not null);

-- Atualização e exclusão apenas pelo dono
drop policy if exists "owner_update_media" on storage.objects;
create policy "owner_update_media" on storage.objects
  for update using (bucket_id = 'media' and owner = auth.uid());

drop policy if exists "owner_delete_media" on storage.objects;
create policy "owner_delete_media" on storage.objects
  for delete using (bucket_id = 'media' and owner = auth.uid());

-- Fim das migrações