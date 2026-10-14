-- ============================================================
-- Recebimentos (valores que clientes devem ao escritório)
-- Rode no SQL Editor do Supabase (uma vez).
-- ============================================================

create table if not exists public.recebimentos (
  id uuid primary key default gen_random_uuid(),
  cliente text not null,
  valor numeric not null default 0,
  moeda text not null default 'BRL',
  data_prevista_cliente date,            -- opcional: quando o cliente recebe o dinheiro dele
  data_vencimento date not null,          -- prazo para pagar ao escritório
  status text not null default 'pendente',-- 'pendente' | 'recebido'
  data_recebimento date,
  comprovante_url text,
  observacao text,
  created_at timestamptz not null default now()
);

create index if not exists idx_recebimentos_venc on public.recebimentos(data_vencimento);
create index if not exists idx_recebimentos_status on public.recebimentos(status);

-- RLS: acesso anônimo (app sem login), igual às outras tabelas
alter table public.recebimentos enable row level security;
drop policy if exists "recebimentos_anon_all" on public.recebimentos;
create policy "recebimentos_anon_all" on public.recebimentos
  for all to anon, authenticated using (true) with check (true);

-- Storage: bucket privado de comprovantes
insert into storage.buckets (id, name, public)
values ('comprovantes','comprovantes', false)
on conflict (id) do nothing;

drop policy if exists "comprovantes_anon_all" on storage.objects;
create policy "comprovantes_anon_all" on storage.objects
  for all to anon, authenticated
  using (bucket_id = 'comprovantes')
  with check (bucket_id = 'comprovantes');
