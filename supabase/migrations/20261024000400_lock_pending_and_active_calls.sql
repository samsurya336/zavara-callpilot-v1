-- A signed provider session is billable and must block another start while the browser connects.
drop index if exists public.call_session_one_active_per_user_idx;

create unique index call_session_one_active_per_user_idx
    on public.call_session (user_id)
    where status in ('CREATED', 'ACTIVE');
