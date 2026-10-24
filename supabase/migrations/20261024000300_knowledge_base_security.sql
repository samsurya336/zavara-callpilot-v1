-- Knowledge Base is personal data. Restore the ownership rules that were
-- relaxed by the hackathon purchase migration for the rest of the schema.

alter table public.knowledge enable row level security;

drop policy if exists "Users manage their own knowledge" on public.knowledge;

create policy "Users read their own knowledge"
on public.knowledge for select to authenticated
using (created_by = auth.uid());

create policy "Users create their own knowledge"
on public.knowledge for insert to authenticated
with check (
    created_by = auth.uid()
    and extraction_status = 'PROCESSING'
    and extracted_text is null
    and extraction_error is null
);

create policy "Users delete their own knowledge"
on public.knowledge for delete to authenticated
using (created_by = auth.uid());

-- Status and extracted content are written only by the Edge Function with the
-- service role. The browser does not need direct UPDATE access.
revoke all on public.knowledge from anon;
revoke update on public.knowledge from authenticated;
grant select, insert, delete on public.knowledge to authenticated;

-- Generated challenges must not become an indirect way to attach or expose
-- another account's knowledge entry.
alter table public.challenge enable row level security;
alter table public.participant enable row level security;

drop policy if exists "Authenticated users read active internal challenges" on public.challenge;
drop policy if exists "Users read their own generated challenges" on public.challenge;
drop policy if exists "Users create their own generated challenges" on public.challenge;
drop policy if exists "Users update their own generated challenges" on public.challenge;
drop policy if exists "Users delete their own generated challenges" on public.challenge;
drop policy if exists "Users read participants for visible challenges" on public.participant;
drop policy if exists "Users manage participants for their challenges" on public.participant;

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

revoke all on public.challenge, public.participant from anon;
revoke insert, update, delete on public.participant from authenticated;
grant select, insert, update, delete on public.challenge to authenticated;
grant select on public.participant to authenticated;

-- The product flow accepts PDF only. NOT VALID keeps an existing legacy TXT
-- row readable while preventing new TXT rows from being created.
alter table public.knowledge drop constraint if exists knowledge_file_type_check;
alter table public.knowledge
    add constraint knowledge_file_type_pdf_check
    check (file_type = 'application/pdf') not valid;

drop policy if exists "Authenticated document access" on storage.objects;
drop policy if exists "Users manage their own knowledge documents" on storage.objects;

create policy "Users read their own knowledge documents"
on storage.objects for select to authenticated
using (
    bucket_id = 'documents'
    and name like 'knowledge/' || auth.uid()::text || '/%'
);

create policy "Users upload their own knowledge documents"
on storage.objects for insert to authenticated
with check (
    bucket_id = 'documents'
    and name like 'knowledge/' || auth.uid()::text || '/%'
);

create policy "Users delete their own knowledge documents"
on storage.objects for delete to authenticated
using (
    bucket_id = 'documents'
    and name like 'knowledge/' || auth.uid()::text || '/%'
);
