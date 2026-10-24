-- Hackathon purchase flow:
-- select an active package, record the purchase, and credit the user's minutes.

create table public.package_plan (
    id uuid primary key default gen_random_uuid(),
    name text not null check (length(trim(name)) > 0),
    amount numeric(12, 2) not null check (amount >= 0),
    currency text not null default 'INR' check (length(currency) between 3 and 3),
    minutes integer not null check (minutes > 0),
    is_active boolean not null default true,
    provider_meta jsonb not null default '{}'::jsonb check (jsonb_typeof(provider_meta) = 'object'),
    provider_config jsonb not null default '{}'::jsonb check (jsonb_typeof(provider_config) = 'object'),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.purchase_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    package_plan_id uuid not null references public.package_plan (id) on delete restrict,
    minutes_credited integer not null check (minutes_credited > 0),
    amount numeric(12, 2) not null check (amount >= 0),
    currency text not null default 'INR' check (length(currency) between 3 and 3),
    provider_meta jsonb not null default '{}'::jsonb check (jsonb_typeof(provider_meta) = 'object'),
    purchased_at timestamptz not null default now()
);

create index purchase_history_user_purchased_at_idx
    on public.purchase_history (user_id, purchased_at desc);

create index purchase_history_package_plan_id_idx
    on public.purchase_history (package_plan_id);

create trigger package_plan_set_updated_at
before update on public.package_plan
for each row execute function public.set_updated_at();

-- A real payment webhook should call equivalent trusted code after payment
-- confirmation. This small function keeps the hackathon demo flow atomic.
create or replace function public.purchase_package(package_id uuid)
returns public.purchase_history
language plpgsql
security definer
set search_path = public
as $$
declare
    current_user_id uuid := auth.uid();
    selected_plan public.package_plan;
    new_purchase public.purchase_history;
begin
    if current_user_id is null then
        raise exception 'Sign in before purchasing a package' using errcode = '42501';
    end if;

    select * into selected_plan
    from public.package_plan
    where id = package_id and is_active
    for update;

    if not found then
        raise exception 'Package plan is not available';
    end if;

    insert into public.account_usage (user_id)
    values (current_user_id)
    on conflict (user_id) do nothing;

    update public.account_usage
    set available_minutes = available_minutes + selected_plan.minutes
    where user_id = current_user_id;

    insert into public.purchase_history (
        user_id,
        package_plan_id,
        minutes_credited,
        amount,
        currency,
        provider_meta
    )
    values (
        current_user_id,
        selected_plan.id,
        selected_plan.minutes,
        selected_plan.amount,
        selected_plan.currency,
        selected_plan.provider_meta
    )
    returning * into new_purchase;

    return new_purchase;
end;
$$;

-- This MVP uses broad authenticated access. There is no per-user RLS filter;
-- the application is a simple hackathon demo and has no sensitive production data.
alter table public.knowledge disable row level security;
alter table public.challenge disable row level security;
alter table public.participant disable row level security;
alter table public.call_session disable row level security;
alter table public.account_usage disable row level security;

drop policy if exists "Users manage their own knowledge" on public.knowledge;
drop policy if exists "Authenticated users read active internal challenges" on public.challenge;
drop policy if exists "Users read their own generated challenges" on public.challenge;
drop policy if exists "Users create their own generated challenges" on public.challenge;
drop policy if exists "Users update their own generated challenges" on public.challenge;
drop policy if exists "Users delete their own generated challenges" on public.challenge;
drop policy if exists "Users read participants for visible challenges" on public.participant;
drop policy if exists "Users manage participants for their challenges" on public.participant;
drop policy if exists "Users manage their own call sessions" on public.call_session;
drop policy if exists "Users read their own usage" on public.account_usage;

grant select, insert, update, delete
on public.knowledge, public.challenge, public.participant, public.call_session,
   public.account_usage, public.package_plan, public.purchase_history
to authenticated;

grant execute on function public.purchase_package(uuid) to authenticated;

drop policy if exists "Users manage their own knowledge documents" on storage.objects;

create policy "Authenticated document access"
on storage.objects for all to authenticated
using (bucket_id = 'documents')
with check (bucket_id = 'documents');
