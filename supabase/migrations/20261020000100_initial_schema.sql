create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    name text not null default '',
    email text not null default '',
    created_at timestamptz not null default now()
);

create table public.organizations (
    id uuid primary key default gen_random_uuid (),
    name text not null check (length(trim(name)) > 0),
    created_by uuid not null references public.profiles (id) on delete cascade,
    created_at timestamptz not null default now()
);

create table public.organization_members (
    organization_id uuid not null references public.organizations (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    role text not null default 'SUPER_ADMIN' check (role = 'SUPER_ADMIN'),
    created_at timestamptz not null default now(),
    primary key (organization_id, user_id)
);

create index organization_members_user_id_idx on public.organization_members (user_id);

alter table public.profiles enable row level security;

alter table public.organizations enable row level security;

alter table public.organization_members enable row level security;

create policy "Authenticated access" on public.profiles for all to authenticated using (true)
with
    check (true);

create policy "Authenticated access" on public.organizations for all to authenticated using (true)
with
    check (true);

create policy "Authenticated access" on public.organization_members for all to authenticated using (true)
with
    check (true);

revoke all on public.profiles,
public.organizations,
public.organization_members
from anon;

grant
select,
insert
,
update,
delete on public.profiles,
public.organizations,
public.organization_members to authenticated;

create function public.sync_auth_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), coalesce(new.email, ''))
  on conflict (id) do update
    set name = excluded.name, email = excluded.email;
  return new;
end;
$$;

create trigger sync_auth_profile
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.sync_auth_profile();

insert into
    public.profiles (id, name, email)
select id, coalesce(
        raw_user_meta_data ->> 'name', ''
    ), coalesce(email, '')
from auth.users on conflict (id) do nothing;

create function public.create_organization(organization_name text)
returns setof public.organizations
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_organization public.organizations;
begin
  if auth.uid() is null then
    raise exception 'Sign in before creating an organization' using errcode = '42501';
  end if;

  insert into public.organizations (name, created_by)
  values (trim(organization_name), auth.uid())
  returning * into new_organization;

  insert into public.organization_members (organization_id, user_id)
  values (new_organization.id, auth.uid());

  return next new_organization;
end;
$$;

revoke
execute on function public.create_organization (text)
from public, anon;

grant
execute on function public.create_organization (text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 52428800, array['application/pdf', 'text/plain'])
on conflict (id) do nothing;

create policy "Authenticated document access" on storage.objects for all to authenticated using (bucket_id = 'documents')
with
    check (bucket_id = 'documents');