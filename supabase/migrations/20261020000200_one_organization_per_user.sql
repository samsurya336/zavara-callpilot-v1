create unique index organizations_one_per_creator on public.organizations (created_by);

create unique index organization_members_one_per_user on public.organization_members (user_id);

create or replace function public.create_organization(organization_name text)
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

  select organization.* into new_organization
  from public.organizations organization
  join public.organization_members membership on membership.organization_id = organization.id
  where membership.user_id = auth.uid();

  if found then
    return next new_organization;
    return;
  end if;

  insert into public.organizations (name, created_by)
  values (trim(organization_name), auth.uid())
  returning * into new_organization;

  insert into public.organization_members (organization_id, user_id)
  values (new_organization.id, auth.uid());

  return next new_organization;
end;
$$;