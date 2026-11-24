-- ============================================================================
-- Medidas & Metas — Script SQL Completo (Supabase + PostgreSQL 17)
-- Camada 1: Google OAuth direto (JWT assinado pelo Supabase Auth)
-- Camada 2: Row Level Security (RLS) multi-tenant isolado por user_id
-- Camada 3: Onboarding automático com 2 alunos de exemplo por novo treinador
-- Camada 4: Portal do Aluno somente leitura via RPC controlada (sem SELECT anon)
-- ============================================================================

-- Função auxiliar para gerar código de acesso legível e único para cada aluno
create or replace function public.gerar_codigo_acesso()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'MM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

grant execute on function public.gerar_codigo_acesso() to authenticated;

-- ============================================================================
-- 1. TABELA: public.perfis_treinador (controle idempotente de onboarding)
-- ============================================================================
create table if not exists public.perfis_treinador (
  user_id uuid primary key references auth.users(id) on delete cascade,
  exemplos_criados boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.perfis_treinador enable row level security;

revoke all on public.perfis_treinador from public, anon;
grant select, insert on public.perfis_treinador to authenticated;

drop policy if exists "perfis_treinador_select_own" on public.perfis_treinador;
create policy "perfis_treinador_select_own"
  on public.perfis_treinador
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "perfis_treinador_insert_own" on public.perfis_treinador;
create policy "perfis_treinador_insert_own"
  on public.perfis_treinador
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

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
security invoker
set search_path = ''
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

revoke all on function public.calcular_imc_avaliacao() from public, anon, authenticated;

drop trigger if exists trg_avaliacoes_calcular_imc on public.avaliacoes;
create trigger trg_avaliacoes_calcular_imc
before insert or update of peso, aluno_id on public.avaliacoes
for each row
execute function public.calcular_imc_avaliacao();

create or replace function public.recalcular_imc_ao_atualizar_altura()
returns trigger
language plpgsql
security invoker
set search_path = ''
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

revoke all on function public.recalcular_imc_ao_atualizar_altura() from public, anon, authenticated;

drop trigger if exists trg_alunos_recalcular_imc on public.alunos;
create trigger trg_alunos_recalcular_imc
after update of altura_cm on public.alunos
for each row
execute function public.recalcular_imc_ao_atualizar_altura();

-- ============================================================================
-- 5. GRANTS EXPLÍCITOS + ROW LEVEL SECURITY (RLS) MULTI-TENANT
-- ============================================================================
grant usage on schema public to anon, authenticated;
revoke all on public.alunos from public, anon;
revoke all on public.avaliacoes from public, anon;
grant select, insert, update, delete on public.alunos to authenticated;
grant select, insert, update, delete on public.avaliacoes to authenticated;

alter table public.alunos enable row level security;
alter table public.avaliacoes enable row level security;

drop policy if exists "alunos_select_own" on public.alunos;
create policy "alunos_select_own"
  on public.alunos for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "alunos_insert_own" on public.alunos;
create policy "alunos_insert_own"
  on public.alunos for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "alunos_update_own" on public.alunos;
create policy "alunos_update_own"
  on public.alunos for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "alunos_delete_own" on public.alunos;
create policy "alunos_delete_own"
  on public.alunos for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "avaliacoes_select_own" on public.avaliacoes;
create policy "avaliacoes_select_own"
  on public.avaliacoes for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "avaliacoes_insert_own" on public.avaliacoes;
create policy "avaliacoes_insert_own"
  on public.avaliacoes for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.alunos a
      where a.id = aluno_id and a.user_id = (select auth.uid())
    )
  );

drop policy if exists "avaliacoes_update_own" on public.avaliacoes;
create policy "avaliacoes_update_own"
  on public.avaliacoes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.alunos a
      where a.id = aluno_id and a.user_id = (select auth.uid())
    )
  );

drop policy if exists "avaliacoes_delete_own" on public.avaliacoes;
create policy "avaliacoes_delete_own"
  on public.avaliacoes for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- 6. RPC IDEMPOTENTE: ONBOARDING COM 2 ALUNOS DE EXEMPLO PARA NOVOS USUÁRIOS
-- ============================================================================
create or replace function public.seed_onboarding_examples()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_inserted uuid;
  v_has_students boolean;
  v_camila_id uuid;
  v_rafael_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('seeded', false, 'reason', 'unauthenticated');
  end if;

  insert into public.perfis_treinador (user_id, exemplos_criados)
  values (v_uid, true)
  on conflict (user_id) do nothing
  returning user_id into v_inserted;

  if v_inserted is null then
    return jsonb_build_object('seeded', false, 'reason', 'already_initialized');
  end if;

  select exists (
    select 1 from public.alunos where user_id = v_uid
  ) into v_has_students;

  if v_has_students then
    return jsonb_build_object('seeded', false, 'reason', 'existing_students');
  end if;

  -- Aluna exemplo 1: Camila Ferreira (apenas dados físicos essenciais, sem contatos fictícios)
  insert into public.alunos (
    user_id, nome, data_nascimento, altura_cm, sexo,
    email, telefone, objetivo, peso_meta, gordura_meta,
    acesso_codigo, acesso_ativo
  )
  values (
    v_uid,
    'Camila Ferreira (Exemplo)',
    '1994-05-18',
    165,
    'F',
    null,
    null,
    'Recomposição Corporal e Definição',
    60.0,
    24.0,
    public.gerar_codigo_acesso(),
    true
  )
  returning id into v_camila_id;

  insert into public.avaliacoes (
    aluno_id, user_id, data_avaliacao,
    peso, gordura_corporal, musculatura, calorias_necessarias, idade_corporal, gordura_visceral,
    biceps_d, biceps_e, ombro, peito, cintura, quadril, coxa_d, coxa_e, panturrilha_d, panturrilha_e,
    observacoes
  )
  values
    (
      v_camila_id, v_uid, current_date - 120,
      67.4, 33.2, 27.1, 1520, 35, 8,
      31.0, 30.8, 101.0, 93.5, 81.0, 104.5, 60.5, 60.2, 37.2, 37.0,
      'Avaliação inicial de exemplo — foco em redução abdominal e ganho de tônus.'
    ),
    (
      v_camila_id, v_uid, current_date - 60,
      64.8, 30.4, 28.3, 1560, 32, 7,
      30.5, 30.4, 101.5, 92.0, 77.2, 102.0, 59.4, 59.2, 37.0, 36.9,
      'Boa adesão ao treino de força 4x/semana e ajuste proteico.'
    ),
    (
      v_camila_id, v_uid, current_date - 5,
      62.3, 27.8, 29.6, 1610, 29, 6,
      30.2, 30.1, 102.4, 91.2, 73.5, 99.8, 58.6, 58.5, 36.8, 36.8,
      'Excelente recomposição: -7,5 cm de cintura e +2,5% de massa muscular. Você pode editar ou excluir este aluno de exemplo.'
    );

  -- Aluno exemplo 2: Rafael Nogueira (apenas dados físicos essenciais, sem contatos fictícios)
  insert into public.alunos (
    user_id, nome, data_nascimento, altura_cm, sexo,
    email, telefone, objetivo, peso_meta, gordura_meta,
    acesso_codigo, acesso_ativo
  )
  values (
    v_uid,
    'Rafael Nogueira (Exemplo)',
    '1991-09-10',
    179,
    'M',
    null,
    null,
    'Hipertrofia e Ganho de Massa Magra',
    84.0,
    14.0,
    public.gerar_codigo_acesso(),
    true
  )
  returning id into v_rafael_id;

  insert into public.avaliacoes (
    aluno_id, user_id, data_avaliacao,
    peso, gordura_corporal, musculatura, calorias_necessarias, idade_corporal, gordura_visceral,
    biceps_d, biceps_e, ombro, peito, cintura, quadril, coxa_d, coxa_e, panturrilha_d, panturrilha_e,
    observacoes
  )
  values
    (
      v_rafael_id, v_uid, current_date - 120,
      77.2, 19.4, 37.8, 2350, 34, 7,
      34.8, 34.5, 117.0, 98.5, 86.0, 98.5, 56.8, 56.5, 37.4, 37.2,
      'Avaliação inicial de exemplo — foco em hipertrofia de superiores e controle de gordura visceral.'
    ),
    (
      v_rafael_id, v_uid, current_date - 60,
      79.5, 17.8, 39.4, 2480, 31, 6,
      36.2, 36.0, 119.4, 101.2, 83.8, 98.0, 58.4, 58.1, 38.0, 37.9,
      'Progressão consistente de carga em peitoral, dorsais e quadríceps.'
    ),
    (
      v_rafael_id, v_uid, current_date - 5,
      81.6, 15.9, 41.2, 2610, 28, 5,
      37.9, 37.7, 122.0, 104.0, 81.2, 97.4, 60.2, 60.0, 38.8, 38.6,
      'Ganho sólido de +3,4% em musculatura com -4,8 cm na cintura. Você pode editar ou excluir este aluno de exemplo.'
    );

  return jsonb_build_object(
    'seeded', true,
    'students', jsonb_build_array(v_camila_id, v_rafael_id)
  );
end;
$$;

revoke all on function public.seed_onboarding_examples() from public, anon;
grant execute on function public.seed_onboarding_examples() to authenticated;

-- ============================================================================
-- 7. RPC SEGURA DO PORTAL DO ALUNO (somente leitura controlada + minimização LGPD)
-- ============================================================================
create or replace function public.get_client_portal(p_identifier text)
returns jsonb
language plpgsql
security definer
set search_path = ''
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
    jsonb_agg(
      jsonb_build_object(
        'id', av.id,
        'aluno_id', av.aluno_id,
        'data_avaliacao', av.data_avaliacao,
        'peso', av.peso,
        'imc', av.imc,
        'gordura_corporal', av.gordura_corporal,
        'musculatura', av.musculatura,
        'calorias_necessarias', av.calorias_necessarias,
        'idade_corporal', av.idade_corporal,
        'gordura_visceral', av.gordura_visceral,
        'biceps_d', av.biceps_d,
        'biceps_e', av.biceps_e,
        'ombro', av.ombro,
        'peito', av.peito,
        'cintura', av.cintura,
        'quadril', av.quadril,
        'coxa_d', av.coxa_d,
        'coxa_e', av.coxa_e,
        'panturrilha_d', av.panturrilha_d,
        'panturrilha_e', av.panturrilha_e,
        'observacoes', av.observacoes,
        'created_at', av.created_at
      )
      order by av.data_avaliacao asc, av.created_at asc
    ),
    '[]'::jsonb
  )
  into v_avaliacoes
  from public.avaliacoes av
  where av.aluno_id = v_aluno.id;

  return jsonb_build_object(
    'aluno', jsonb_build_object(
      'id', v_aluno.id,
      'nome', v_aluno.nome,
      'data_nascimento', v_aluno.data_nascimento,
      'altura_cm', v_aluno.altura_cm,
      'sexo', v_aluno.sexo,
      'email', null,
      'telefone', null,
      'objetivo', v_aluno.objetivo,
      'peso_meta', v_aluno.peso_meta,
      'gordura_meta', v_aluno.gordura_meta,
      'acesso_codigo', v_aluno.acesso_codigo,
      'acesso_ativo', v_aluno.acesso_ativo,
      'ultimo_acesso', now(),
      'created_at', v_aluno.created_at
    ),
    'avaliacoes', v_avaliacoes
  );
end;
$$;

revoke all on function public.get_client_portal(text) from public;
grant execute on function public.get_client_portal(text) to anon, authenticated;
