-- ============================================================================
-- Medidas & Metas — Script SQL Completo (Segurança Máxima)
-- Camada 1: Google OAuth (JWT assinado pelo Supabase + 2FA do Google)
-- Camada 2: Chave de Acesso do Treinador com hash bcrypt + anti brute-force
-- Camada 3: Row Level Security (RLS) exigindo auth.uid() + treinador autorizado
-- Camada 4: Portal do Aluno somente leitura via RPC controlada (sem SELECT anon)
-- ============================================================================

create extension if not exists "pgcrypto";

-- Função auxiliar para gerar código de acesso legível para alunos
create or replace function public.gerar_codigo_acesso()
returns text
language sql
volatile
as $$
  select 'MM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

-- ============================================================================
-- 1. SEGURANÇA DO TREINADOR: Chaves com hash bcrypt + Rate Limit + Autorização
-- ============================================================================
create table if not exists public.treinadores_autorizados (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome_estudio text not null default 'Medidas & Metas',
  ativo boolean not null default true,
  ativado_em timestamptz not null default now()
);

-- Chaves armazenadas APENAS em hash bcrypt (nunca em texto puro)
create table if not exists public.chaves_treinador (
  id uuid primary key default gen_random_uuid(),
  label text not null default 'Chave Principal',
  key_hash text not null,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Registro de tentativas falhas para bloqueio contra força bruta (rate limit)
create table if not exists public.tentativas_acesso (
  id bigint generated always as identity primary key,
  scope text not null,          -- 'trainer_key' | 'client_portal'
  actor_key text not null,      -- user_id ou código tentado
  created_at timestamptz not null default now()
);

create index if not exists idx_tentativas_scope_actor
  on public.tentativas_acesso (scope, actor_key, created_at desc);

-- RLS fechada nas tabelas de segurança: cliente NUNCA lê hashes nem grava direto
alter table public.treinadores_autorizados enable row level security;
alter table public.chaves_treinador enable row level security;
alter table public.tentativas_acesso enable row level security;

drop policy if exists "treinadores_select_self" on public.treinadores_autorizados;
create policy "treinadores_select_self"
  on public.treinadores_autorizados
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Helper usado por TODAS as políticas RLS das tabelas de negócio
create or replace function public.is_authorized_trainer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.treinadores_autorizados t
    where t.user_id = auth.uid()
      and t.ativo = true
  );
$$;

-- RPC 1: Verifica se o treinador autenticado via Google já ativou sua chave
create or replace function public.check_trainer_status()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_authorized_trainer();
$$;

grant execute on function public.check_trainer_status() to authenticated;

-- RPC 2: Valida a Chave de Acesso do Treinador (hash bcrypt + rate limit 5/15min)
-- e vincula definitivamente a chave ao usuário Google autenticado.
create or replace function public.activate_trainer_key(p_access_key text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_clean text := trim(coalesce(p_access_key, ''));
  v_failures integer;
  v_key_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Faça login com o Google primeiro.');
  end if;

  -- Já autorizado?
  if public.is_authorized_trainer() then
    return jsonb_build_object('ok', true);
  end if;

  if char_length(v_clean) < 6 then
    return jsonb_build_object('ok', false, 'error', 'Chave de acesso inválida.');
  end if;

  -- Rate limit: máx. 5 tentativas erradas em 15 minutos
  select count(*) into v_failures
  from public.tentativas_acesso
  where scope = 'trainer_key'
    and actor_key = v_uid::text
    and created_at > now() - interval '15 minutes';

  if v_failures >= 5 then
    return jsonb_build_object(
      'ok', false,
      'error', 'Muitas tentativas incorretas. Aguarde 15 minutos para tentar novamente.'
    );
  end if;

  -- Busca chave ativa não reivindicada (ou já pertencente ao mesmo user_id)
  select id into v_key_id
  from public.chaves_treinador
  where ativo = true
    and (claimed_by is null or claimed_by = v_uid)
    and key_hash = crypt(v_clean, key_hash)
  limit 1;

  if v_key_id is null then
    insert into public.tentativas_acesso (scope, actor_key)
    values ('trainer_key', v_uid::text);

    return jsonb_build_object(
      'ok', false,
      'error', 'Chave de treinador incorreta ou já vinculada a outra conta.'
    );
  end if;

  -- Vincula chave e autoriza o treinador
  update public.chaves_treinador
  set claimed_by = v_uid,
      claimed_at = now()
  where id = v_key_id;

  insert into public.treinadores_autorizados (user_id, ativo)
  values (v_uid, true)
  on conflict (user_id)
  do update set ativo = true, ativado_em = now();

  delete from public.tentativas_acesso
  where scope = 'trainer_key' and actor_key = v_uid::text;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.activate_trainer_key(text) to authenticated;

-- ============================================================================
-- 2. TABELA: public.alunos
-- ============================================================================
create table if not exists public.alunos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null check (char_length(trim(nome)) > 0),
  data_nascimento date not null,
  altura_cm numeric(5, 2) not null check (altura_cm > 0 and altura_cm < 300),
  sexo text not null check (sexo in ('M', 'F')),

  email text,
  telefone text,
  objetivo text not null default 'Recomposição Corporal',
  peso_meta numeric(5, 2),
  gordura_meta numeric(4, 1),
  avatar_pele text not null default 'tan' check (avatar_pele in ('light', 'tan', 'brown', 'deep')),

  acesso_codigo text not null unique default public.gerar_codigo_acesso(),
  acesso_token uuid not null unique default gen_random_uuid(),
  acesso_ativo boolean not null default true,
  ultimo_acesso timestamptz,

  created_at timestamptz not null default now()
);

alter table public.alunos add column if not exists email text;
alter table public.alunos add column if not exists telefone text;
alter table public.alunos add column if not exists objetivo text not null default 'Recomposição Corporal';
alter table public.alunos add column if not exists peso_meta numeric(5, 2);
alter table public.alunos add column if not exists gordura_meta numeric(4, 1);
alter table public.alunos add column if not exists avatar_pele text not null default 'tan';
alter table public.alunos add column if not exists acesso_codigo text unique default public.gerar_codigo_acesso();
alter table public.alunos add column if not exists acesso_token uuid unique default gen_random_uuid();
alter table public.alunos add column if not exists acesso_ativo boolean not null default true;
alter table public.alunos add column if not exists ultimo_acesso timestamptz;

-- ============================================================================
-- 3. TABELA: public.avaliacoes
-- ============================================================================
create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data_avaliacao date not null default current_date,

  peso numeric(5, 2) not null check (peso > 0),
  imc numeric(4, 1),
  gordura_corporal numeric(4, 1),
  musculatura numeric(4, 1),
  calorias_necessarias integer,
  idade_corporal integer,
  gordura_visceral integer,

  biceps_d numeric(5, 1),
  biceps_e numeric(5, 1),
  ombro numeric(5, 1),
  peito numeric(5, 1),
  cintura numeric(5, 1),
  quadril numeric(5, 1),
  coxa_d numeric(5, 1),
  coxa_e numeric(5, 1),
  panturrilha_d numeric(5, 1),
  panturrilha_e numeric(5, 1),

  observacoes text,
  created_at timestamptz not null default now()
);

alter table public.avaliacoes add column if not exists observacoes text;

-- ============================================================================
-- 4. ÍNDICES E TRIGGERS DE IMC
-- ============================================================================
create index if not exists idx_alunos_user_nome
  on public.alunos (user_id, nome);

create index if not exists idx_alunos_acesso_codigo
  on public.alunos (upper(acesso_codigo));

create index if not exists idx_avaliacoes_user_id
  on public.avaliacoes (user_id);

create index if not exists idx_avaliacoes_aluno_data
  on public.avaliacoes (aluno_id, data_avaliacao desc, created_at desc);

create or replace function public.calcular_imc_avaliacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_altura_cm numeric;
begin
  select altura_cm into v_altura_cm
  from public.alunos
  where id = new.aluno_id;

  if v_altura_cm is not null and v_altura_cm > 0 and new.peso is not null and new.peso > 0 then
    new.imc := round((new.peso / power(v_altura_cm / 100.0, 2))::numeric, 1);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_avaliacoes_calcular_imc on public.avaliacoes;
create trigger trg_avaliacoes_calcular_imc
before insert or update of peso, aluno_id on public.avaliacoes
for each row
execute function public.calcular_imc_avaliacao();

create or replace function public.recalcular_imc_ao_atualizar_altura()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.altura_cm is distinct from old.altura_cm and new.altura_cm > 0 then
    update public.avaliacoes
    set imc = round((peso / power(new.altura_cm / 100.0, 2))::numeric, 1)
    where aluno_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_alunos_recalcular_imc on public.alunos;
create trigger trg_alunos_recalcular_imc
after update of altura_cm on public.alunos
for each row
execute function public.recalcular_imc_ao_atualizar_altura();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) — EXIGE Google Auth + Chave de Treinador Ativa
-- ============================================================================
alter table public.alunos enable row level security;
alter table public.avaliacoes enable row level security;

drop policy if exists "alunos_select_own" on public.alunos;
create policy "alunos_select_own"
  on public.alunos for select to authenticated
  using (auth.uid() = user_id and public.is_authorized_trainer());

drop policy if exists "alunos_insert_own" on public.alunos;
create policy "alunos_insert_own"
  on public.alunos for insert to authenticated
  with check (auth.uid() = user_id and public.is_authorized_trainer());

drop policy if exists "alunos_update_own" on public.alunos;
create policy "alunos_update_own"
  on public.alunos for update to authenticated
  using (auth.uid() = user_id and public.is_authorized_trainer())
  with check (auth.uid() = user_id and public.is_authorized_trainer());

drop policy if exists "alunos_delete_own" on public.alunos;
create policy "alunos_delete_own"
  on public.alunos for delete to authenticated
  using (auth.uid() = user_id and public.is_authorized_trainer());

drop policy if exists "avaliacoes_select_own" on public.avaliacoes;
create policy "avaliacoes_select_own"
  on public.avaliacoes for select to authenticated
  using (auth.uid() = user_id and public.is_authorized_trainer());

drop policy if exists "avaliacoes_insert_own" on public.avaliacoes;
create policy "avaliacoes_insert_own"
  on public.avaliacoes for insert to authenticated
  with check (
    auth.uid() = user_id
    and public.is_authorized_trainer()
    and exists (
      select 1 from public.alunos a
      where a.id = aluno_id and a.user_id = auth.uid()
    )
  );

drop policy if exists "avaliacoes_update_own" on public.avaliacoes;
create policy "avaliacoes_update_own"
  on public.avaliacoes for update to authenticated
  using (auth.uid() = user_id and public.is_authorized_trainer())
  with check (
    auth.uid() = user_id
    and public.is_authorized_trainer()
    and exists (
      select 1 from public.alunos a
      where a.id = aluno_id and a.user_id = auth.uid()
    )
  );

drop policy if exists "avaliacoes_delete_own" on public.avaliacoes;
create policy "avaliacoes_delete_own"
  on public.avaliacoes for delete to authenticated
  using (auth.uid() = user_id and public.is_authorized_trainer());

-- ============================================================================
-- 6. RPC SEGURA DO PORTAL DO ALUNO (somente leitura, sem SELECT aberto)
-- ============================================================================
create or replace function public.get_client_portal(p_identifier text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean text := trim(coalesce(p_identifier, ''));
  v_aluno public.alunos%rowtype;
  v_avaliacoes jsonb;
begin
  if char_length(v_clean) < 4 then
    return null;
  end if;

  select * into v_aluno
  from public.alunos
  where acesso_ativo = true
    and (
      upper(acesso_codigo) = upper(v_clean)
      or acesso_token::text = v_clean
    )
  limit 1;

  if not found then
    return null;
  end if;

  update public.alunos
  set ultimo_acesso = now()
  where id = v_aluno.id;

  select coalesce(
    jsonb_agg(to_jsonb(av) order by av.data_avaliacao asc, av.created_at asc),
    '[]'::jsonb
  )
  into v_avaliacoes
  from public.avaliacoes av
  where av.aluno_id = v_aluno.id;

  return jsonb_build_object(
    'aluno', to_jsonb(v_aluno),
    'avaliacoes', v_avaliacoes
  );
end;
$$;

grant execute on function public.get_client_portal(text) to anon, authenticated;

-- ============================================================================
-- 7. CRIAÇÃO DA CHAVE MESTRA INICIAL DO TREINADOR (TROQUE ANTES DE RODAR!)
-- Armazenada com hash bcrypt irreversível. Após usada 1 vez, fica vinculada
-- exclusivamente à sua conta Google e nenhuma outra conta consegue usá-la.
-- ============================================================================
insert into public.chaves_treinador (label, key_hash)
select
  'Chave Principal do Treinador',
  extensions.crypt('TROQUE-POR-SUA-CHAVE-SECRETA-2026', extensions.gen_salt('bf', 10))
where not exists (
  select 1 from public.chaves_treinador where label = 'Chave Principal do Treinador'
);
