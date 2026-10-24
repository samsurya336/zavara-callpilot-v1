-- Zavara CallPilot MVP feature schema.
-- Ownership is per authenticated account for the event MVP; organisations and
-- payment checkout are deliberately not part of these tables.

create type public.knowledge_extraction_status as enum ('PROCESSING', 'READY', 'FAILED');
create type public.challenge_source as enum ('INTERNAL', 'KNOWLEDGE_BASE');
create type public.call_type as enum ('ONE_ON_ONE', 'BOARDROOM');
create type public.call_mode as enum ('ASSIST', 'BATTLE');
create type public.call_status as enum ('CREATED', 'ACTIVE', 'COMPLETED', 'FAILED', 'CANCELLED');
create type public.report_status as enum ('NOT_REQUESTED', 'PROCESSING', 'READY', 'FAILED');

create table public.knowledge (
    id uuid primary key default gen_random_uuid(),
    created_by uuid not null references public.profiles (id) on delete cascade,
    title text not null check (length(trim(title)) > 0),
    file_url text not null,
    file_type text not null check (file_type in ('application/pdf', 'text/plain')),
    file_size_bytes integer not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
    file_meta jsonb not null default '{}'::jsonb check (jsonb_typeof(file_meta) = 'object'),
    extraction_status public.knowledge_extraction_status not null default 'PROCESSING',
    extracted_text text check (extracted_text is null or octet_length(extracted_text) <= 2000000),
    extraction_error text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (id, created_by)
);

create index knowledge_created_by_created_at_idx
    on public.knowledge (created_by, created_at desc);

create table public.challenge (
    id uuid primary key default gen_random_uuid(),
    created_by uuid references public.profiles (id) on delete set null,
    title text not null check (length(trim(title)) > 0),
    description text not null default '',
    category text not null default 'General',
    difficulty text not null check (difficulty in ('EASY', 'MEDIUM', 'HARD')),
    call_type public.call_type not null,
    duration_minutes integer not null check (duration_minutes between 1 and 60),
    objective text not null,
    scenario text not null,
    product_context text,
    tags text[] not null default '{}',
    is_active boolean not null default true,
    source public.challenge_source not null default 'INTERNAL',
    knowledge_id uuid,
    configs jsonb not null default '{}'::jsonb check (jsonb_typeof(configs) = 'object'),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint challenge_source_reference_check check (
        (source = 'INTERNAL' and created_by is null and knowledge_id is null)
        or
        (source = 'KNOWLEDGE_BASE' and created_by is not null and knowledge_id is not null)
    ),
    constraint challenge_knowledge_owner_fkey
        foreign key (knowledge_id, created_by)
        references public.knowledge (id, created_by)
        on delete restrict
);

create index challenge_browse_idx
    on public.challenge (source, is_active, created_at desc);
create index challenge_created_by_idx on public.challenge (created_by);
create index challenge_knowledge_id_idx on public.challenge (knowledge_id);

create table public.participant (
    id uuid primary key default gen_random_uuid(),
    challenge_id uuid not null references public.challenge (id) on delete cascade,
    name text not null check (length(trim(name)) > 0),
    designation text not null,
    company text not null,
    personality text not null,
    communication_style text not null,
    hidden_motivation text not null,
    objections jsonb not null default '[]'::jsonb check (jsonb_typeof(objections) = 'array'),
    decision_authority text not null,
    voice_configs jsonb not null default '{}'::jsonb check (jsonb_typeof(voice_configs) = 'object'),
    sort_order smallint not null default 0 check (sort_order >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (challenge_id, sort_order)
);

create index participant_challenge_idx on public.participant (challenge_id, sort_order);

create table public.call_session (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    challenge_id uuid not null references public.challenge (id) on delete restrict,
    status public.call_status not null default 'CREATED',
    mode public.call_mode not null,
    parent_session_id uuid,
    branch_from_turn_id text,
    challenge_snapshot jsonb not null default '{}'::jsonb
        check (jsonb_typeof(challenge_snapshot) = 'object'),
    settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
    transcript jsonb not null default '[]'::jsonb check (jsonb_typeof(transcript) = 'array'),
    report jsonb,
    report_status public.report_status not null default 'NOT_REQUESTED',
    provider_session_id text,
    recording_url text,
    started_at timestamptz,
    ended_at timestamptz,
    duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
    usage jsonb not null default '{}'::jsonb check (jsonb_typeof(usage) = 'object'),
    metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (id, user_id),
    constraint call_session_branch_reference_check check (
        (parent_session_id is null and branch_from_turn_id is null)
        or
        (parent_session_id is not null and branch_from_turn_id is not null
            and length(trim(branch_from_turn_id)) > 0)
    ),
    constraint call_session_parent_fkey
        foreign key (parent_session_id, user_id)
        references public.call_session (id, user_id)
        on delete restrict,
    constraint call_session_time_check check (
        ended_at is null or started_at is null or ended_at >= started_at
    )
);

create index call_session_user_created_at_idx
    on public.call_session (user_id, created_at desc);
create index call_session_parent_idx on public.call_session (parent_session_id);
create unique index call_session_one_active_per_user_idx
    on public.call_session (user_id)
    where status = 'ACTIVE';

create table public.account_usage (
    user_id uuid primary key references public.profiles (id) on delete cascade,
    available_minutes integer not null default 10 check (available_minutes >= 0),
    reserved_minutes integer not null default 0 check (reserved_minutes >= 0),
    consumed_minutes integer not null default 0 check (consumed_minutes >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger knowledge_set_updated_at
before update on public.knowledge
for each row execute function public.set_updated_at();

create trigger challenge_set_updated_at
before update on public.challenge
for each row execute function public.set_updated_at();

create trigger participant_set_updated_at
before update on public.participant
for each row execute function public.set_updated_at();

create trigger call_session_set_updated_at
before update on public.call_session
for each row execute function public.set_updated_at();

create trigger account_usage_set_updated_at
before update on public.account_usage
for each row execute function public.set_updated_at();

create or replace function public.initialize_account_usage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.account_usage (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
    return new;
end;
$$;

create trigger profile_initialize_account_usage
after insert on public.profiles
for each row execute function public.initialize_account_usage();

insert into public.account_usage (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

alter table public.knowledge enable row level security;
alter table public.challenge enable row level security;
alter table public.participant enable row level security;
alter table public.call_session enable row level security;
alter table public.account_usage enable row level security;

create policy "Users manage their own knowledge"
on public.knowledge for all to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "Authenticated users read active internal challenges"
on public.challenge for select to authenticated
using (source = 'INTERNAL' and is_active);

create policy "Users read their own generated challenges"
on public.challenge for select to authenticated
using (created_by = auth.uid());

create policy "Users create their own generated challenges"
on public.challenge for insert to authenticated
with check (
    source = 'KNOWLEDGE_BASE'
    and created_by = auth.uid()
    and exists (
        select 1
        from public.knowledge k
        where k.id = challenge.knowledge_id
          and k.created_by = auth.uid()
          and k.extraction_status = 'READY'
    )
);

create policy "Users update their own generated challenges"
on public.challenge for update to authenticated
using (created_by = auth.uid())
with check (
    created_by = auth.uid()
    and source = 'KNOWLEDGE_BASE'
    and exists (
        select 1
        from public.knowledge k
        where k.id = challenge.knowledge_id
          and k.created_by = auth.uid()
          and k.extraction_status = 'READY'
    )
);

create policy "Users delete their own generated challenges"
on public.challenge for delete to authenticated
using (created_by = auth.uid());

create policy "Users read participants for visible challenges"
on public.participant for select to authenticated
using (
    exists (
        select 1
        from public.challenge c
        where c.id = participant.challenge_id
          and c.is_active
          and (c.source = 'INTERNAL' or c.created_by = auth.uid())
    )
);

create policy "Users manage participants for their challenges"
on public.participant for all to authenticated
using (
    exists (
        select 1 from public.challenge c
        where c.id = participant.challenge_id and c.created_by = auth.uid()
    )
)
with check (
    exists (
        select 1 from public.challenge c
        where c.id = participant.challenge_id and c.created_by = auth.uid()
    )
);

create view public.participant_public
as
select
    p.id,
    p.challenge_id,
    p.name,
    p.designation,
    p.company,
    p.personality,
    p.communication_style,
    p.decision_authority,
    p.sort_order
from public.participant p
join public.challenge c on c.id = p.challenge_id
where c.is_active
  and (c.source = 'INTERNAL' or c.created_by = auth.uid());

create policy "Users manage their own call sessions"
on public.call_session for all to authenticated
using (user_id = auth.uid())
with check (
    user_id = auth.uid()
    and exists (
        select 1
        from public.challenge c
        where c.id = call_session.challenge_id
          and c.is_active
          and (c.source = 'INTERNAL' or c.created_by = auth.uid())
    )
);

create policy "Users read their own usage"
on public.account_usage for select to authenticated
using (user_id = auth.uid());

grant select, insert, update, delete
on public.knowledge, public.challenge, public.call_session
to authenticated;

revoke all on public.participant from anon, authenticated;
grant select on public.participant_public to authenticated;

revoke all on public.account_usage from anon, authenticated;
grant select on public.account_usage to authenticated;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.initialize_account_usage() from public, anon, authenticated;

-- Keep the existing bucket, but make the MVP's per-file limit explicit and
-- require paths under knowledge/<user-id>/ for private ownership.
update storage.buckets
set file_size_limit = 10485760
where id = 'documents';

drop policy if exists "Authenticated document access" on storage.objects;

create policy "Users manage their own knowledge documents"
on storage.objects for all to authenticated
using (
    bucket_id = 'documents'
    and name like 'knowledge/' || auth.uid()::text || '/%'
)
with check (
    bucket_id = 'documents'
    and name like 'knowledge/' || auth.uid()::text || '/%'
);
