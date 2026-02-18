-- Enable UUID extension
create extension if not exists "uuid-ossp";
-- Enable pgcrypto for password hashing
create extension if not exists "pgcrypto";

-- 1. ENUMS
create type user_role as enum ('admin', 'of', 'consultant');
create type case_status as enum ('draft', 'active', 'submitted', 'validated', 'rejected');
create type evidence_status as enum ('pending', 'valid', 'invalid');
create type transaction_type as enum ('purchase', 'adjustment', 'usage');

-- 2. PROFILES (Linked to Auth)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role user_role not null default 'of',
  first_name text,
  last_name text,
  commercial_name text,
  siret text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to create profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'of'));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. WALLETS (Consultant Credits)
create table public.credits_wallet (
  consultant_id uuid primary key references public.profiles(id) on delete cascade,
  balance integer default 0 check (balance >= 0),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Trigger to create wallet when a consultant is created
create or replace function public.handle_new_consultant_wallet()
returns trigger as $$
begin
  if new.role = 'consultant' then
    insert into public.credits_wallet (consultant_id, balance) values (new.id, 0);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_consultant_wallet();


-- 4. TRANSACTIONS (History)
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  wallet_id uuid references public.credits_wallet(consultant_id) on delete cascade,
  amount integer not null, -- Positive for credit, negative for debit
  transaction_type transaction_type not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. TENANTS (Organismes de Formation - Clients)
create table public.tenants (
  id uuid primary key default uuid_generate_v4(),
  siret text unique,
  name text not null,
  nda text,
  address text,
  logo_url text,
  owner_id uuid references public.profiles(id) on delete cascade, -- Link to the User Account of the OF
  created_by uuid references public.profiles(id) on delete set null, -- The Consultant who created this OF
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. CASE (Dossiers)
create table public.cases (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  category text, -- 'mono-site' (1 credit), 'multi-site' (2 credits)
  status case_status default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. REFERENTIAL (Criteria & Indicators)
create table public.criteria (
  id integer primary key, 
  label text not null,
  description text
);

create table public.indicators (
  id integer primary key, 
  criterion_id integer references public.criteria(id),
  code text not null, -- 'I1', ... 'I32'
  label text,
  description text
);

-- Seed Data (7 Criteres)
insert into public.criteria (id, label, description) values
(1, 'Information', 'Conditions d’information du public'),
(2, 'Objectifs', 'Identification précise des objectifs des prestations'),
(3, 'Adaptation', 'Adaptation aux publics bénéficiaires'),
(4, 'Moyens', 'Adéquation des moyens pédagogiques'),
(5, 'Qualification', 'Qualification et développement des connaissances'),
(6, 'Environnement', 'Inscription et investissement du prestataire'),
(7, 'Amélioration', 'Recueil et prise en compte des appréciations');

-- Seed Data (32 Indicateurs - Simplified)
-- This is a placeholder loop, in production we would insert real verification text
do $$
declare
  i integer;
  c_id integer;
begin
  for i in 1..32 loop
    -- Rough mapping of indicators to criteria
    if i <= 3 then c_id := 1;
    elsif i <= 8 then c_id := 2;
    elsif i <= 16 then c_id := 3;
    elsif i <= 20 then c_id := 4;
    elsif i <= 22 then c_id := 5;
    elsif i <= 29 then c_id := 6;
    else c_id := 7;
    end if;
    
    insert into public.indicators (id, criterion_id, code, label)
    values (i, c_id, 'I' || i, 'Indicateur ' || i);
  end loop;
end $$;


-- 8. SESSIONS
create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  label text, 
  date_session timestamp with time zone,
  tenant_id uuid references public.tenants(id) on delete cascade
);

-- 9. EVIDENCES
create table public.evidences (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid references public.cases(id) on delete cascade,
  indicator_id integer references public.indicators(id),
  session_id uuid references public.sessions(id) on delete cascade,
  file_path text not null,
  status evidence_status default 'pending',
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. REVIEWS (Validation Consultant)
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid references public.cases(id) on delete cascade,
  indicator_id integer references public.indicators(id),
  reviewer_id uuid references public.profiles(id) on delete cascade,
  decision text,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. LOGS (Security Trace)
create table public.logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  action text not null,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BUSINESS LOGIC FUNCTIONS (RPC)

-- Function to debit wallet and create case atomically
create or replace function public.create_case_and_debit(
  p_consultant_id uuid,
  p_tenant_name text,
  p_siret text,
  p_case_category text -- 'mono-site' or 'multi-site'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_cost int;
  v_wallet_balance int;
  v_tenant_id uuid;
  v_case_id uuid;
begin
  -- 1. Determine Cost
  if p_case_category = 'mono-site' then
    v_cost := 1;
  elsif p_case_category = 'multi-site' then
    v_cost := 2;
  else
    raise exception 'Invalid category. Must be mono-site or multi-site';
  end if;

  -- 2. Check Balance (with row lock)
  select balance into v_wallet_balance
  from public.credits_wallet
  where consultant_id = p_consultant_id
  for update;

  if v_wallet_balance is null then
    raise exception 'Wallet not found for consultant';
  end if;

  if v_wallet_balance < v_cost then
    raise exception 'Solde insuffisant (Requis: %, Disponible: %)', v_cost, v_wallet_balance;
  end if;

  -- 3. Create Tenant (OF)
  insert into public.tenants (name, siret, created_by)
  values (p_tenant_name, p_siret, p_consultant_id)
  returning id into v_tenant_id;

  -- 4. Create Case
  insert into public.cases (tenant_id, category, status)
  values (v_tenant_id, p_case_category, 'draft')
  returning id into v_case_id;

  -- 5. Debit Wallet
  update public.credits_wallet
  set balance = balance - v_cost,
      updated_at = now()
  where consultant_id = p_consultant_id;

  -- 6. Log Transaction
  insert into public.transactions (wallet_id, amount, transaction_type, description)
  values (p_consultant_id, -v_cost, 'usage', 'Creation dossier ' || p_case_category || ' pour ' || p_tenant_name);

  -- 7. Audit Log
  insert into public.logs (user_id, action, details)
  values (p_consultant_id, 'CREATE_CASE_DEBIT', jsonb_build_object('case_id', v_case_id, 'cost', v_cost));

  return jsonb_build_object('case_id', v_case_id, 'tenant_id', v_tenant_id, 'new_balance', v_wallet_balance - v_cost);
end;
$$;

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

-- 1. PROFILES
alter table public.profiles enable row level security;

-- Admin can view all profiles
  using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- Users can view their own profile
create policy "Users view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

-- Users can update their own profile
create policy "Users update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- 2. CREDITS WALLET
alter table public.credits_wallet enable row level security;

create policy "Admins view all wallets"
  on public.credits_wallet for select
  using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- Admin can update wallets
create policy "Admins update all wallets"
  on public.credits_wallet for update
  using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- Consultants view their own wallet
create policy "Consultants view own wallet"
  on public.credits_wallet for select
  using ( auth.uid() = consultant_id );

-- 3. TRANSACTIONS
alter table public.transactions enable row level security;

-- Admin view all
create policy "Admins view all transactions"
  on public.transactions for select
  using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- Consultant view own
create policy "Consultants view own transactions"
  on public.transactions for select
  using ( wallet_id = auth.uid() );

-- 4. TENANTS (OF / Clients)
alter table public.tenants enable row level security;

-- Admin view all
create policy "Admins view all tenants"
  on public.tenants for select
  using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- Consultant views tenants they created
create policy "Consultants view created tenants"
  on public.tenants for all
  using ( created_by = auth.uid() );

-- Tenant Owner (The Client himself) view his own tenant
create policy "Client view own tenant"
  on public.tenants for select
  using ( owner_id = auth.uid() );

-- 5. CASES (Dossiers)
alter table public.cases enable row level security;

-- Admin view all
create policy "Admins view all cases"
  on public.cases for select
  using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- Consultant views cases of his tenants
create policy "Consultants view cases of their tenants"
  on public.cases for all
  using (
    exists (
      select 1 from public.tenants
      where id = cases.tenant_id
      and created_by = auth.uid()
    )
  );

-- Client views cases of his tenant
create policy "Client view cases of his tenant"
  on public.cases for select
  using (
    exists (
      select 1 from public.tenants
      where id = cases.tenant_id
      and owner_id = auth.uid()
    )
  );

-- 6. EVIDENCES (Preuves)
alter table public.evidences enable row level security;

-- Policy based on Case access (Generic)
create policy "Access evidences based on case access"
  on public.evidences for all
  using (
    exists (
      select 1 from public.cases
      where id = evidences.case_id
      -- This implies the user must have access to the case via RLS on cases, but SQL RLS doesn't recursively check policies in subqueries automatically without performance impacts or infinite recursion if not careful.
      -- So we explicit the conditions again:
      and (
         -- Admin
         ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
         or
         -- Consultant (Owner of Tenant)
         exists (select 1 from public.tenants t where t.id = cases.tenant_id and t.created_by = auth.uid())
         or
         -- Client (Owner of Tenant)
         exists (select 1 from public.tenants t where t.id = cases.tenant_id and t.owner_id = auth.uid())
      )
    )
  );

-- 7. SESSIONS (Audits)
alter table public.sessions enable row level security;

-- Admin view all
create policy "Admins view all sessions"
  on public.sessions for select
  using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- Consultant view sessions of his tenants
create policy "Consultants view sessions of their tenants"
  on public.sessions for all
  using (
    exists (
      select 1 from public.tenants
      where id = sessions.tenant_id
      and created_by = auth.uid()
    )
  );

-- Client view sessions of his tenant
create policy "Client view sessions of his tenant"
  on public.sessions for select
  using (
    exists (
      select 1 from public.tenants
      where id = sessions.tenant_id
      and owner_id = auth.uid()
    )
  );

-- 8. REVIEWS
alter table public.reviews enable row level security;

-- Admin view all
create policy "Admins view all reviews"
  on public.reviews for select
  using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- Consultant view reviews (he created them or for his tenants)
create policy "Consultants manage reviews"
  on public.reviews for all
  using (
    exists (
      select 1 from public.cases c
      join public.tenants t on t.id = c.tenant_id
      where c.id = reviews.case_id
      and t.created_by = auth.uid()
    )
  );

-- Client view reviews for his case
create policy "Client view reviews for his case"
  on public.reviews for select
  using (
    exists (
      select 1 from public.cases c
      join public.tenants t on t.id = c.tenant_id
      where c.id = reviews.case_id
      and t.owner_id = auth.uid()
    )
  );

-- 9. CASE INDICATOR STATES (Client Self-Declared Progress)
-- The Client marks "Done", "In Progress" or "N/A" for each indicator.

create type indicator_progression_status as enum ('to_do', 'in_progress', 'done', 'not_applicable');

create table public.case_indicator_states (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid references public.cases(id) on delete cascade,
  indicator_id integer references public.indicators(id),
  status indicator_progression_status default 'to_do',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(case_id, indicator_id)
);

alter table public.case_indicator_states enable row level security;

-- Admin view all
create policy "Admins view all states"
  on public.case_indicator_states for select
  using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- Consultant view states of his cases
create policy "Consultants view states of their cases"
  on public.case_indicator_states for select
  using (
    exists (
      select 1 from public.cases c
      join public.tenants t on t.id = c.tenant_id
      where c.id = case_indicator_states.case_id
      and t.created_by = auth.uid()
    )
  );

-- Client manage states of his case
create policy "Client manage states of his case"
  on public.case_indicator_states for all
  using (
    exists (
      select 1 from public.cases c
      join public.tenants t on t.id = c.tenant_id
      where c.id = case_indicator_states.case_id
      and t.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.cases c
      join public.tenants t on t.id = c.tenant_id
      where c.id = case_indicator_states.case_id
      and t.owner_id = auth.uid()
    )
  );
