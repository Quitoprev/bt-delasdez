-- =====================================================================
-- CLUBE BT DELAS — Parcerias e descontos exclusivos
-- Rodar DEPOIS do clube_gamificacao.sql (usa is_admin() e atletas).
-- =====================================================================

create table if not exists public.parceiros (
  id          serial primary key,
  nome        text not null,
  categoria   text not null default 'Outros',     -- ex.: Moda, Saúde, Alimentação, Equipamentos, Estética
  resumo      text not null,                       -- a oferta em uma linha: "15% off em toda a loja"
  descricao   text,                                -- detalhes e regras
  cupom       text,                                -- código (se houver). Só atleta logada vê
  como_usar   text,                                -- ex.: "Mostre o cartão do Clube no caixa"
  instagram   text,                                -- sem @
  whatsapp    text,                                -- só números, com DDD
  site        text,
  endereco    text,
  logo_path   text,                                -- caminho no bucket 'parceiros'
  cor         text default '#2A2A9E',              -- cor de fundo do card quando não tiver logo
  destaque    boolean not null default false,      -- aparece no topo
  valido_ate  date,                                -- vazio = sem prazo
  ordem       int not null default 0,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);
alter table public.parceiros enable row level security;

drop policy if exists "logadas veem parceiros ativos" on public.parceiros;
create policy "logadas veem parceiros ativos" on public.parceiros
  for select using (
    auth.role() = 'authenticated'
    and ((ativo and (valido_ate is null or valido_ate >= public.hoje_maceio())) or public.is_admin())
  );

drop policy if exists "admin gerencia parceiros" on public.parceiros;
create policy "admin gerencia parceiros" on public.parceiros
  for all using (public.is_admin()) with check (public.is_admin());

-- Cada vez que a atleta abre o cartão de desconto, fica registrado.
-- Serve pra mostrar ao parceiro quantas atletas usaram (argumento pra renovar a parceria).
create table if not exists public.resgates (
  id          bigserial primary key,
  parceiro_id int  not null references public.parceiros(id) on delete cascade,
  atleta_id   uuid not null references public.atletas(id) on delete cascade default auth.uid(),
  criado_em   timestamptz not null default now()
);
create index if not exists resgates_parceiro on public.resgates (parceiro_id, criado_em);
alter table public.resgates enable row level security;

drop policy if exists "atleta registra resgate" on public.resgates;
create policy "atleta registra resgate" on public.resgates
  for insert with check (atleta_id = auth.uid());

drop policy if exists "atleta ve os proprios resgates" on public.resgates;
create policy "atleta ve os proprios resgates" on public.resgates
  for select using (atleta_id = auth.uid() or public.is_admin());

-- Relatório para a organização: usos por parceiro (total, no mês, atletas diferentes)
create or replace view public.relatorio_parcerias
with (security_invoker = true) as
  select p.id, p.nome, p.categoria, p.ativo,
         count(r.id)                                                     as usos_total,
         count(r.id) filter (where r.criado_em >= date_trunc('month', now())) as usos_no_mes,
         count(distinct r.atleta_id)                                     as atletas_diferentes
  from public.parceiros p
  left join public.resgates r on r.parceiro_id = p.id
  group by p.id
  order by usos_total desc;

-- Bucket público para os logos dos parceiros (só a organização sobe)
insert into storage.buckets (id, name, public)
values ('parceiros', 'parceiros', true)
on conflict (id) do nothing;

drop policy if exists "admin sobe logo de parceiro" on storage.objects;
create policy "admin sobe logo de parceiro" on storage.objects
  for all to authenticated
  using (bucket_id = 'parceiros' and public.is_admin())
  with check (bucket_id = 'parceiros' and public.is_admin());

-- =====================================================================
-- COMO CADASTRAR UM PARCEIRO (Table Editor → parceiros, ou SQL):
--
-- insert into public.parceiros (nome, categoria, resumo, descricao, cupom, como_usar, instagram, whatsapp, endereco, destaque)
-- values ('Nome da Loja', 'Moda', '15% off em toda a loja',
--         'Válido para compras na loja física e no site. Não cumulativo.',
--         'BTDELAS15', 'Mostre o cartão do Clube no caixa ou use o cupom no site.',
--         'perfildaloja', '82999999999', 'Rua X, 123 – Ponta Verde', true);
--
-- Logo: Storage → bucket "parceiros" → upload (ex.: loja.png) → preencher logo_path = 'loja.png'
-- Relatório de usos: select * from public.relatorio_parcerias;
-- =====================================================================
