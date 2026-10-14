-- ============================================================
-- Controle Financeiro — Lima Advogados
-- Script completo: schema + RLS + storage + dados migrados
-- Rode no SQL Editor do seu projeto Supabase (uma vez).
-- ============================================================

-- 1) TABELAS -------------------------------------------------
create table if not exists public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null default 'Geral',
  valor_esperado numeric not null default 0,
  moeda text not null default 'BRL',
  ciclo text not null default 'mensal',
  dia_vencimento int,
  ativo boolean not null default true,
  observacao text,
  created_at timestamptz not null default now()
);

create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  descricao text not null,
  valor numeric not null default 0,
  moeda text not null default 'BRL',
  tipo text not null default 'compra',
  categoria text,
  status text not null default 'pago',
  assinatura_id uuid references public.assinaturas(id) on delete set null,
  beneficiario text,
  reembolsado boolean not null default false,
  data_reembolso date,
  recibo_url text,
  tem_recibo boolean not null default false,
  observacao text,
  created_at timestamptz not null default now()
);

create index if not exists idx_lancamentos_data on public.lancamentos(data);
create index if not exists idx_lancamentos_tipo on public.lancamentos(tipo);
create index if not exists idx_lancamentos_assinatura on public.lancamentos(assinatura_id);

-- 2) RLS: acesso total para usuários autenticados ------------
alter table public.assinaturas enable row level security;
alter table public.lancamentos enable row level security;

drop policy if exists "assinaturas_auth_all" on public.assinaturas;
create policy "assinaturas_auth_all" on public.assinaturas
  for all to authenticated using (true) with check (true);

drop policy if exists "lancamentos_auth_all" on public.lancamentos;
create policy "lancamentos_auth_all" on public.lancamentos
  for all to authenticated using (true) with check (true);

-- 3) STORAGE: bucket privado de recibos ----------------------
insert into storage.buckets (id, name, public)
values ('recibos','recibos', false)
on conflict (id) do nothing;

drop policy if exists "recibos_auth_all" on storage.objects;
create policy "recibos_auth_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'recibos')
  with check (bucket_id = 'recibos');

-- 4) DADOS: limpa e semeia -----------------------------------
delete from public.lancamentos;
delete from public.assinaturas;

insert into public.assinaturas (nome,categoria,valor_esperado,moeda,ciclo,dia_vencimento) values
('Jusbrasil','Jurídico',208.9,'BRL','mensal',6),
('Clicksign','Software',69.0,'BRL','mensal',16),
('Coworking Smart (Endereço Fiscal)','Estrutura',79.0,'BRL','mensal',5),
('In Company (Assessoria de Marketing)','Marketing',4750.0,'BRL','mensal',11),
('Crédito Celular — Lima Cobrança','Telefonia',20.0,'BRL','mensal',NULL),
('Crédito Celular — Lima Interno','Telefonia',20.0,'BRL','mensal',NULL),
('Lovable','Software',140.69,'BRL','mensal',17),
('Netlify','Software',17.99,'USD','mensal',10),
('Registro.br','Domínio',40.0,'BRL','anual',NULL);

insert into public.lancamentos (data,descricao,valor,moeda,tipo,categoria,status,assinatura_id,beneficiario,reembolsado,data_reembolso,tem_recibo)
select v.data,v.descricao,v.valor,v.moeda,v.tipo,v.categoria,v.status,a.id,v.beneficiario,v.reembolsado,v.data_reembolso,v.tem_recibo
from (values
('2026-04-14'::date,'CHIP LIMA INTERNO',20.0,'BRL','assinatura','Telefonia','pago','Crédito Celular — Lima Interno',NULL,false,NULL,false),
('2026-05-16'::date,'CLICKSING',69.0,'BRL','assinatura','Software','pago','Clicksign',NULL,false,NULL,false),
('2026-05-20'::date,'CARTÓRIO - AUTENTICAÇÃO RG RICARDO ABDO',12.36,'BRL','compra','Cartório','pago',NULL,NULL,false,NULL,false),
('2026-05-26'::date,'CRÉDITO CELULAR LIMA COBRANÇA',20.0,'BRL','assinatura','Telefonia','pago','Crédito Celular — Lima Cobrança',NULL,false,NULL,false),
('2026-05-26'::date,'CRÉDITO CELIULAR LIMA INTERNO',20.0,'BRL','assinatura','Telefonia','pago','Crédito Celular — Lima Interno',NULL,false,NULL,false),
('2026-05-28'::date,'ENVELOPES NOTIFICAÇÕES',12.0,'BRL','compra','Papelaria','pago',NULL,NULL,false,NULL,false),
('2026-05-28'::date,'RECIBO 99 HAYNOAM',31.02,'BRL','reembolso','Transporte','pago',NULL,'Haynoan',true,'2026-05-28'::date,true),
('2026-05-28'::date,'RECIBO SR AMILTON 1 - AUDIÊNCIA',70.0,'BRL','reembolso','Audiência','pago',NULL,'Amilton',true,'2026-05-28'::date,true),
('2026-05-28'::date,'RECIBO SR AMILTON 2 - AUDIÊNCIA',97.0,'BRL','reembolso','Audiência','pago',NULL,'Amilton',true,'2026-05-28'::date,true),
('2026-05-28'::date,'RECIBO SR AMILTON 3 - AUDIÊNCIA',153.0,'BRL','reembolso','Audiência','pago',NULL,'Amilton',true,'2026-05-28'::date,true),
('2026-06-01'::date,'PAPELARIA',23.3,'BRL','compra','Papelaria','pago',NULL,NULL,false,NULL,false),
('2026-06-06'::date,'JUSBRASIL',208.9,'BRL','assinatura','Jurídico','pago','Jusbrasil',NULL,false,NULL,false),
('2026-06-11'::date,'DOCES JOGO DA COPA',63.51,'BRL','compra','Confraternização','pago',NULL,NULL,false,NULL,false),
('2026-06-11'::date,'SALGADOS JOGO DA COPA',43.92,'BRL','compra','Confraternização','pago',NULL,NULL,false,NULL,false),
('2026-06-11'::date,'CORREIOS',931.25,'BRL','compra','Correios','pago',NULL,NULL,false,NULL,false),
('2026-06-16'::date,'PAPELARIA',60.96,'BRL','compra','Papelaria','pago',NULL,NULL,false,NULL,false),
('2026-06-16'::date,'CLICKSING',69.0,'BRL','assinatura','Software','pago','Clicksign',NULL,false,NULL,false),
('2026-06-25'::date,'CUSTA JUDICIAL',35.75,'BRL','compra','Custas Judiciais','pago',NULL,NULL,false,NULL,false),
('2026-07-06'::date,'JUSBRASIL',208.9,'BRL','assinatura','Jurídico','pago','Jusbrasil',NULL,false,NULL,false),
('2026-07-16'::date,'CLICKSING',69.0,'BRL','assinatura','Software','pago','Clicksign',NULL,false,NULL,false),
('2026-07-17'::date,'RECIBO SR AMILTON 1 - AUDIÊNCIA',171.0,'BRL','reembolso','Audiência','pago',NULL,'Amilton',true,'2026-07-17'::date,true),
('2026-07-17'::date,'RECIBO SR AMILTON 2 - AUDIÊNCIA',120.0,'BRL','reembolso','Audiência','pago',NULL,'Amilton',true,'2026-07-17'::date,true),
('2026-07-24'::date,'RECIBO UBER GIZELLY - CARTÓRIO ÍDA',22.93,'BRL','reembolso','Transporte','pago',NULL,'Gizelly',true,'2026-07-24'::date,true),
('2026-07-24'::date,'RECIBO UBER GIZELLY - CARTÓRIO VOLTA',22.93,'BRL','reembolso','Transporte','pago',NULL,'Gizelly',true,'2026-07-24'::date,true),
('2026-07-27'::date,'RECIBO HAYNOAN - AUDIÊNCIA',17.2,'BRL','reembolso','Audiência','pago',NULL,'Haynoan',true,'2026-07-27'::date,true),
('2026-07-27'::date,'RECIBO ESTACIONAMENTO AUDIÊNCIA - RUTH',89.99,'BRL','reembolso','Audiência','pago',NULL,'Ruth',true,'2026-07-27'::date,true),
('2026-07-27'::date,'NF ENDEREÇO FISCAL LIMA ADVOGADOS',79.0,'BRL','assinatura','Estrutura','pago','Coworking Smart (Endereço Fiscal)',NULL,false,NULL,false),
('2026-07-30'::date,'RECIBO HAYNOAN - PERÍCIA MÃE ESTER',8.95,'BRL','reembolso','Perícia','pago',NULL,'Haynoan',true,'2026-07-30'::date,true),
('2026-07-30'::date,'RECIBO HAYNOAN - PERÍCIA MÃE ESTER',33.71,'BRL','reembolso','Perícia','pago',NULL,'Haynoan',true,'2026-07-30'::date,true),
('2026-07-31'::date,'CRÉDITO CELULAR LIMA COBRANÇA',20.0,'BRL','assinatura','Telefonia','pago','Crédito Celular — Lima Cobrança',NULL,false,NULL,false),
('2026-07-31'::date,'CRÉDITO CELIULAR LIMA INTERNO',20.0,'BRL','assinatura','Telefonia','pago','Crédito Celular — Lima Interno',NULL,false,NULL,false),
('2026-08-06'::date,'JUSBRASIL',208.9,'BRL','assinatura','Jurídico','pago','Jusbrasil',NULL,false,NULL,false),
('2026-08-10'::date,'NETLIFY',17.99,'USD','assinatura','Software','pago','Netlify',NULL,false,NULL,false),
('2026-08-10'::date,'REGISTRO.BR',40.0,'BRL','assinatura','Domínio','pago','Registro.br',NULL,false,NULL,false),
('2026-08-12'::date,'RECIBO HAYNOAN - AUDIÊNCIA',25.1,'BRL','reembolso','Audiência','pago',NULL,'Haynoan',true,'2026-08-12'::date,true),
('2026-08-12'::date,'RECIBO HAYNOAN - AUDIÊNCIA',19.45,'BRL','reembolso','Audiência','pago',NULL,'Haynoan',true,'2026-08-12'::date,true),
('2026-08-16'::date,'CLICKSING',69.0,'BRL','assinatura','Software','pago','Clicksign',NULL,false,NULL,false),
('2026-08-17'::date,'RECIBO SR AMILTON 1 - AUDIÊNCIA',85.0,'BRL','reembolso','Audiência','pago',NULL,'Amilton',true,'2026-08-17'::date,true),
('2026-08-17'::date,'RECIBO SR AMILTON 2 - AUDIÊNCIA',80.0,'BRL','reembolso','Audiência','pago',NULL,'Amilton',true,'2026-08-17'::date,true),
('2026-09-05'::date,'COWORKING SMART - ENDEREÇO FISCAL LIMA ADVOGADOS',79.0,'BRL','assinatura','Estrutura','pago','Coworking Smart (Endereço Fiscal)',NULL,false,NULL,false),
('2026-09-11'::date,'IN COMPANY - ASSESSORIA DE MARKETING',4750.0,'BRL','assinatura','Marketing','pago','In Company (Assessoria de Marketing)',NULL,false,NULL,false),
('2026-09-17'::date,'LOVABLE',140.69,'BRL','assinatura','Software','pago','Lovable',NULL,false,NULL,false),
('2026-09-17'::date,'CRÉDITO CELULAR LIMA COBRANÇA',20.0,'BRL','assinatura','Telefonia','pago','Crédito Celular — Lima Cobrança',NULL,false,NULL,false),
('2026-09-17'::date,'CRÉDITO CELIULAR LIMA INTERNO',20.0,'BRL','assinatura','Telefonia','pago','Crédito Celular — Lima Interno',NULL,false,NULL,false),
('2026-09-24'::date,'RECIBO HAYNOAN - PERÍCIA ANDRÉIA',11.94,'BRL','reembolso','Perícia','pago',NULL,'Haynoan',true,'2026-09-24'::date,true),
('2026-10-01'::date,'CORREIOS',216.8,'BRL','compra','Correios','pago',NULL,NULL,false,NULL,false),
('2026-10-05'::date,'COWORKING SMART - ENDEREÇO FISCAL LIMA ADVOGADOS',79.0,'BRL','assinatura','Estrutura','pago','Coworking Smart (Endereço Fiscal)',NULL,false,NULL,false),
('2026-10-11'::date,'IN COMPANY - ASSESSORIA DE MARKETING',4750.0,'BRL','assinatura','Marketing','pendente','In Company (Assessoria de Marketing)',NULL,false,NULL,false)
) as v(data,descricao,valor,moeda,tipo,categoria,status,assinatura_nome,beneficiario,reembolsado,data_reembolso,tem_recibo)
left join public.assinaturas a on a.nome = v.assinatura_nome;
