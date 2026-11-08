-- ============================================================
--  BT DELAS · SUPER 8 BEACH TENNIS
--  Schema de referência — já rodado em 08/11/2026.
--  Só use este arquivo se precisar recriar o banco.
-- ============================================================

create table if not exists inscricoes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  telefone    text,
  email       text,
  categoria   text not null check (categoria in ('C','D')),
  status      text not null default 'pendente' check (status in ('pendente','pago','espera')),
  created_at  timestamptz not null default now()
);

create table if not exists estado (
  chave      text primary key,
  valor      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table inscricoes enable row level security;
alter table estado     enable row level security;

drop policy if exists "org acesso total inscricoes" on inscricoes;
create policy "org acesso total inscricoes" on inscricoes
  for all to authenticated using (true) with check (true);

drop policy if exists "estado leitura publica" on estado;
create policy "estado leitura publica" on estado
  for select to anon, authenticated using (true);
drop policy if exists "estado escrita org" on estado;
create policy "estado escrita org" on estado
  for all to authenticated using (true) with check (true);

create or replace function limite_categoria(cat text)
returns int language sql immutable as $$
  select case cat when 'C' then 24 when 'D' then 16 else 0 end;
$$;

create or replace function abertura_inscricoes()
returns timestamptz language sql immutable as $$
  select '2026-11-10 12:00:00-03'::timestamptz;
$$;

create or replace function inscricoes_abertas()
returns boolean language sql stable as $$
  select now() >= abertura_inscricoes();
$$;

create or replace function reservar_vaga(p_nome text, p_tel text, p_email text, p_cat text)
returns table(id uuid, status text)
language plpgsql security definer set search_path = public as $$
declare v_usadas int; v_status text; v_id uuid;
begin
  if not inscricoes_abertas() then raise exception 'inscricoes_fechadas'; end if;
  if p_cat not in ('C','D') then raise exception 'categoria_invalida'; end if;
  if p_nome is null or length(trim(p_nome)) = 0 then raise exception 'nome_obrigatorio'; end if;
  perform pg_advisory_xact_lock(hashtext('vaga_' || p_cat)::bigint);
  select count(*) into v_usadas from inscricoes where categoria = p_cat and status <> 'espera';
  if v_usadas < limite_categoria(p_cat) then v_status := 'pendente';
  else v_status := 'espera'; end if;
  insert into inscricoes(nome, telefone, email, categoria, status)
       values (trim(p_nome), p_tel, p_email, p_cat, v_status)
    returning inscricoes.id into v_id;
  id := v_id; status := v_status; return next;
end;
$$;

create or replace function status_inscricao(p_id uuid)
returns text language sql security definer set search_path = public as $$
  select status from inscricoes where id = p_id;
$$;

create or replace function vagas()
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'abertas',  inscricoes_abertas(),
    'abertura', abertura_inscricoes(),
    'C',        greatest(limite_categoria('C') - (select count(*) from inscricoes where categoria='C' and status<>'espera'), 0),
    'D',        greatest(limite_categoria('D') - (select count(*) from inscricoes where categoria='D' and status<>'espera'), 0)
  );
$$;

grant execute on function reservar_vaga(text,text,text,text) to anon, authenticated;
grant execute on function status_inscricao(uuid)            to anon, authenticated;
grant execute on function vagas()                           to anon, authenticated;
grant execute on function inscricoes_abertas()              to anon, authenticated;
grant execute on function abertura_inscricoes()             to anon, authenticated;

alter publication supabase_realtime add table inscricoes;
alter publication supabase_realtime add table estado;
