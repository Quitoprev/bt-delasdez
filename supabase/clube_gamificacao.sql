-- =====================================================================
-- CLUBE BT DELAS — cadastro de atletas + gamificação (estilo Gym Rats)
-- Rodar no SQL Editor do projeto Supabase "bt-delas" (uma vez só).
-- Pode rodar de novo sem quebrar: usa IF NOT EXISTS / OR REPLACE.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Helpers
-- ---------------------------------------------------------------------
create or replace function public.hoje_maceio()
returns date language sql stable as $$
  select (now() at time zone 'America/Maceio')::date
$$;

-- Organização (quem pode moderar check-ins e lançar pontos)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

drop policy if exists "admin ve admins" on public.admins;
create policy "admin ve admins" on public.admins
  for select using (public.is_admin());

-- ---------------------------------------------------------------------
-- 1. Atletas (perfil do Clube, 1:1 com auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.atletas (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  apelido     text,
  whatsapp    text,
  instagram   text,
  categoria   text check (categoria in ('C','D','Iniciante','Outra')),
  avatar_path text,
  criado_em   timestamptz not null default now()
);
alter table public.atletas enable row level security;

drop policy if exists "atleta ve o proprio perfil" on public.atletas;
create policy "atleta ve o proprio perfil" on public.atletas
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "atleta edita o proprio perfil" on public.atletas;
create policy "atleta edita o proprio perfil" on public.atletas
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Perfil público (sem WhatsApp) para feed e ranking
create or replace view public.perfis_publicos as
  select id, nome, apelido, instagram, categoria, avatar_path
  from public.atletas;
grant select on public.perfis_publicos to authenticated;

-- Cria o perfil automaticamente quando a atleta se cadastra
create or replace function public.criar_perfil_atleta()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.atletas (id, nome, apelido, whatsapp, categoria)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nome',''), split_part(new.email,'@',1)),
    nullif(new.raw_user_meta_data->>'apelido',''),
    nullif(new.raw_user_meta_data->>'whatsapp',''),
    nullif(new.raw_user_meta_data->>'categoria','')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created_atleta on auth.users;
create trigger on_auth_user_created_atleta
  after insert on auth.users
  for each row execute function public.criar_perfil_atleta();

-- ---------------------------------------------------------------------
-- 2. Tipos de atividade (pontos editáveis pelo painel)
-- ---------------------------------------------------------------------
create table if not exists public.tipos_atividade (
  id       serial primary key,
  slug     text unique not null,
  nome     text not null,
  emoji    text,
  pontos   int  not null check (pontos >= 0),
  eh_beach boolean not null default false,
  ordem    int  not null default 0,
  ativo    boolean not null default true
);
alter table public.tipos_atividade enable row level security;

drop policy if exists "todos leem tipos" on public.tipos_atividade;
create policy "todos leem tipos" on public.tipos_atividade
  for select using (auth.role() = 'authenticated');

drop policy if exists "admin gerencia tipos" on public.tipos_atividade;
create policy "admin gerencia tipos" on public.tipos_atividade
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.tipos_atividade (slug, nome, emoji, pontos, eh_beach, ordem) values
  ('jogo_beach',   'Jogo de beach',          '🎾', 3, true,  1),
  ('treino_beach', 'Treino de beach',        '🏝️', 3, true,  2),
  ('aula_beach',   'Aula de beach',          '👩‍🏫', 3, true,  3),
  ('outra',        'Outra atividade física', '💪', 1, false, 4)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 3. Check-ins
-- ---------------------------------------------------------------------
create table if not exists public.checkins (
  id        bigserial primary key,
  atleta_id uuid not null references public.atletas(id) on delete cascade,
  tipo_id   int  not null references public.tipos_atividade(id),
  data      date not null default public.hoje_maceio(),
  pontos    int  not null default 0,
  eh_beach  boolean not null default false,
  foto_path text not null,
  legenda   text check (char_length(legenda) <= 280),
  status    text not null default 'valido' check (status in ('valido','removido')),
  criado_em timestamptz not null default now()
);
create index if not exists checkins_atleta_data on public.checkins (atleta_id, data);
create index if not exists checkins_feed on public.checkins (criado_em desc) where status = 'valido';

-- Trava: data é sempre "hoje" em Maceió e os pontos vêm da tabela de tipos
-- (a atleta não consegue mandar data retroativa nem pontos inventados)
create or replace function public.preparar_checkin()
returns trigger language plpgsql security definer set search_path = public as $$
declare t record;
begin
  select pontos, eh_beach, ativo into t from public.tipos_atividade where id = new.tipo_id;
  if not found or not t.ativo then
    raise exception 'Tipo de atividade inválido';
  end if;
  new.atleta_id := auth.uid();
  new.data      := public.hoje_maceio();
  new.pontos    := t.pontos;
  new.eh_beach  := t.eh_beach;
  new.status    := 'valido';
  new.criado_em := now();
  if (select count(*) from public.checkins
       where atleta_id = new.atleta_id and data = new.data and status = 'valido') >= 3 then
    raise exception 'Limite de 3 check-ins por dia';
  end if;
  return new;
end $$;

drop trigger if exists checkins_before_insert on public.checkins;
create trigger checkins_before_insert
  before insert on public.checkins
  for each row execute function public.preparar_checkin();

alter table public.checkins enable row level security;

drop policy if exists "logadas veem checkins validos" on public.checkins;
create policy "logadas veem checkins validos" on public.checkins
  for select using (auth.role() = 'authenticated' and (status = 'valido' or atleta_id = auth.uid() or public.is_admin()));

drop policy if exists "atleta faz checkin" on public.checkins;
create policy "atleta faz checkin" on public.checkins
  for insert with check (auth.uid() is not null);

drop policy if exists "atleta apaga o proprio checkin" on public.checkins;
create policy "atleta apaga o proprio checkin" on public.checkins
  for delete using (atleta_id = auth.uid() or public.is_admin());

drop policy if exists "admin modera checkin" on public.checkins;
create policy "admin modera checkin" on public.checkins
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. Curtidas
-- ---------------------------------------------------------------------
create table if not exists public.curtidas (
  checkin_id bigint not null references public.checkins(id) on delete cascade,
  atleta_id  uuid   not null references public.atletas(id) on delete cascade default auth.uid(),
  criado_em  timestamptz not null default now(),
  primary key (checkin_id, atleta_id)
);
alter table public.curtidas enable row level security;

drop policy if exists "logadas veem curtidas" on public.curtidas;
create policy "logadas veem curtidas" on public.curtidas
  for select using (auth.role() = 'authenticated');

drop policy if exists "atleta curte" on public.curtidas;
create policy "atleta curte" on public.curtidas
  for insert with check (atleta_id = auth.uid());

drop policy if exists "atleta descurte" on public.curtidas;
create policy "atleta descurte" on public.curtidas
  for delete using (atleta_id = auth.uid());

-- ---------------------------------------------------------------------
-- 5. Pontos extras (torneio BT Delas = 5 pts, ajustes da organização)
-- ---------------------------------------------------------------------
create table if not exists public.pontos_extras (
  id        bigserial primary key,
  atleta_id uuid not null references public.atletas(id) on delete cascade,
  data      date not null default public.hoje_maceio(),
  pontos    int  not null,
  motivo    text not null,
  criado_em timestamptz not null default now()
);
alter table public.pontos_extras enable row level security;

drop policy if exists "logadas veem extras" on public.pontos_extras;
create policy "logadas veem extras" on public.pontos_extras
  for select using (auth.role() = 'authenticated');

drop policy if exists "admin lanca extras" on public.pontos_extras;
create policy "admin lanca extras" on public.pontos_extras
  for all using (public.is_admin()) with check (public.is_admin());

-- Lança 5 pts de torneio para uma lista de atletas (usar no painel/SQL Editor)
create or replace function public.lancar_pontos_torneio(p_atletas uuid[], p_data date, p_nome text default 'Torneio BT Delas')
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() and auth.uid() is not null then
    raise exception 'Somente a organização';
  end if;
  insert into public.pontos_extras (atleta_id, data, pontos, motivo)
  select a, p_data, 5, p_nome from unnest(p_atletas) a
  where not exists (select 1 from public.pontos_extras e
                    where e.atleta_id = a and e.data = p_data and e.motivo = p_nome);
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------------------------------------------------------------------
-- 6. Pontuação
--   * por dia vale só o check-in de MAIOR pontuação
--   * +2 pts a cada 4 semanas seguidas com pelo menos 1 beach
-- ---------------------------------------------------------------------

-- Pontos por atleta por dia (check-ins)
create or replace view public.pontos_diarios as
  select atleta_id, data, max(pontos) as pontos
  from public.checkins
  where status = 'valido'
  group by atleta_id, data;

-- Semanas (segunda a domingo) com beach, sequência e bônus
create or replace view public.semanas_beach as
with semanas as (
  select distinct atleta_id, date_trunc('week', data)::date as semana
  from public.checkins
  where status = 'valido' and eh_beach
),
ilhas as (
  select atleta_id, semana,
         semana - (row_number() over (partition by atleta_id order by semana) * 7)::int as grupo
  from semanas
)
select atleta_id, semana,
       row_number() over (partition by atleta_id, grupo order by semana) as semanas_seguidas,
       case when row_number() over (partition by atleta_id, grupo order by semana) % 4 = 0
            then 2 else 0 end as bonus
from ilhas;

-- Ranking de um mês (p_mes = qualquer dia do mês; padrão: mês atual)
create or replace function public.ranking_mes(p_mes date default null)
returns table (
  atleta_id uuid, nome text, apelido text, avatar_path text, categoria text,
  pontos bigint, dias_ativos bigint, dias_beach bigint, bonus bigint, posicao bigint
)
language sql stable security definer set search_path = public as $$
  with mes as (
    select date_trunc('month', coalesce(p_mes, public.hoje_maceio()))::date as ini,
           (date_trunc('month', coalesce(p_mes, public.hoje_maceio())) + interval '1 month')::date as fim
  ),
  d as (
    select pd.atleta_id, sum(pd.pontos) as pts, count(*) as dias
    from public.pontos_diarios pd, mes
    where pd.data >= mes.ini and pd.data < mes.fim
    group by pd.atleta_id
  ),
  db as (
    select c.atleta_id, count(distinct c.data) as dias_beach
    from public.checkins c, mes
    where c.status = 'valido' and c.eh_beach and c.data >= mes.ini and c.data < mes.fim
    group by c.atleta_id
  ),
  b as (
    -- bônus conta no mês em que a semana termina (domingo)
    select s.atleta_id, sum(s.bonus) as bonus
    from public.semanas_beach s, mes
    where (s.semana + 6) >= mes.ini and (s.semana + 6) < mes.fim
    group by s.atleta_id
  ),
  e as (
    select pe.atleta_id, sum(pe.pontos) as extras
    from public.pontos_extras pe, mes
    where pe.data >= mes.ini and pe.data < mes.fim
    group by pe.atleta_id
  ),
  tot as (
    select a.id as atleta_id, a.nome, a.apelido, a.avatar_path, a.categoria,
           (coalesce(d.pts,0) + coalesce(b.bonus,0) + coalesce(e.extras,0))::bigint as pontos,
           coalesce(d.dias,0)::bigint as dias_ativos,
           coalesce(db.dias_beach,0)::bigint as dias_beach,
           coalesce(b.bonus,0)::bigint as bonus
    from public.atletas a
    left join d  on d.atleta_id  = a.id
    left join db on db.atleta_id = a.id
    left join b  on b.atleta_id  = a.id
    left join e  on e.atleta_id  = a.id
  )
  select tot.*, rank() over (order by pontos desc, dias_beach desc) as posicao
  from tot
  where pontos > 0
  order by posicao, nome
$$;
revoke execute on function public.ranking_mes(date) from public, anon;
grant execute on function public.ranking_mes(date) to authenticated;

-- Sequência atual de semanas com beach (para a tela inicial)
create or replace function public.minha_sequencia()
returns int language sql stable security definer set search_path = public as $$
  select coalesce((
    select semanas_seguidas::int from public.semanas_beach
    where atleta_id = auth.uid()
      and semana >= date_trunc('week', public.hoje_maceio())::date - 7  -- semana atual ou a anterior
    order by semana desc limit 1
  ), 0)
$$;
grant execute on function public.minha_sequencia() to authenticated;

-- Feed com nome, tipo e curtidas num só lugar
create or replace view public.feed_checkins
with (security_invoker = true) as
  select c.id, c.atleta_id, c.data, c.pontos, c.eh_beach, c.foto_path, c.legenda, c.criado_em,
         t.nome as tipo_nome, t.emoji as tipo_emoji,
         p.nome, p.apelido, p.avatar_path,
         (select count(*) from public.curtidas k where k.checkin_id = c.id) as curtidas,
         exists (select 1 from public.curtidas k where k.checkin_id = c.id and k.atleta_id = auth.uid()) as curti
  from public.checkins c
  join public.tipos_atividade t on t.id = c.tipo_id
  join public.perfis_publicos p on p.id = c.atleta_id
  where c.status = 'valido';
grant select on public.feed_checkins to authenticated;

-- ---------------------------------------------------------------------
-- 7. Storage: bucket de fotos dos check-ins (pasta = id da atleta)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('checkins', 'checkins', true)
on conflict (id) do nothing;

drop policy if exists "atleta sobe foto na propria pasta" on storage.objects;
create policy "atleta sobe foto na propria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'checkins' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "atleta apaga a propria foto" on storage.objects;
create policy "atleta apaga a propria foto" on storage.objects
  for delete to authenticated
  using (bucket_id = 'checkins' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

drop policy if exists "atleta troca a propria foto" on storage.objects;
create policy "atleta troca a propria foto" on storage.objects
  for update to authenticated
  using (bucket_id = 'checkins' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
-- DEPOIS DE RODAR:
-- 1) Torne-se admin (troque pelo seu e-mail):
--    insert into public.admins (user_id)
--    select id from auth.users where email = 'SEU_EMAIL_AQUI';
-- 2) Lançar 5 pts de torneio (exemplo):
--    select public.lancar_pontos_torneio(
--      array(select id from public.atletas where whatsapp in ('82999990000','82988880000')),
--      '2026-12-13', 'Super 8 — 13/12');
-- =====================================================================
