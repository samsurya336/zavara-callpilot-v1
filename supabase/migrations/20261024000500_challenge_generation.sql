-- Knowledge-based Challenges are generated in the background by the
-- generate-challenges Edge Function. Placeholder rows track that work and stay
-- inactive, so no call can start on a half-made challenge.

create type public.challenge_generation_status as enum ('PROCESSING', 'READY', 'FAILED');

alter table public.challenge
    add column generation_status public.challenge_generation_status not null default 'READY',
    add column generation_error text,
    add constraint challenge_generation_inactive_check
        check (generation_status = 'READY' or not is_active);

-- One in-flight run per knowledge entry and slot, so repeated clicks or
-- parallel requests cannot start duplicate agent runs.
create unique index challenge_generation_in_flight_idx
    on public.challenge (knowledge_id, ((configs -> 'generation' ->> 'slot')))
    where generation_status = 'PROCESSING';

-- Generated challenges and their participants are written only by the Edge
-- Function with the service role. The browser keeps read and delete access.
drop policy if exists "Users create their own generated challenges" on public.challenge;
drop policy if exists "Users update their own generated challenges" on public.challenge;
revoke insert, update on public.challenge from authenticated;

-- Hidden motivations and objections are server-side data. The browser reads
-- participants through participant_public, which omits them.
revoke select on public.participant from authenticated;
