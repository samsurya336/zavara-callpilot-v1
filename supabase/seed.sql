-- Challenges and participants live in seeds/challenges.sql.

insert into public.package_plan (
    id,
    name,
    amount,
    currency,
    minutes,
    provider_meta,
    provider_config
)
values
(
    '30000000-0000-0000-0000-000000000001',
    'Starter Practice Pack',
    99.00,
    'INR',
    30,
    '{"display_label":"30 extra practice minutes"}'::jsonb,
    '{"demo_checkout":true}'::jsonb
),
(
    '30000000-0000-0000-0000-000000000002',
    'Focused Practice Pack',
    199.00,
    'INR',
    90,
    '{"display_label":"90 extra practice minutes"}'::jsonb,
    '{"demo_checkout":true}'::jsonb
),
(
    '30000000-0000-0000-0000-000000000003',
    'Builder Practice Pack',
    399.00,
    'INR',
    240,
    '{"display_label":"240 extra practice minutes"}'::jsonb,
    '{"demo_checkout":true}'::jsonb
)
on conflict (id) do nothing;
