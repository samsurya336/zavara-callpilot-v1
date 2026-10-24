insert into public.challenge (
    id,
    title,
    description,
    category,
    difficulty,
    call_type,
    duration_minutes,
    objective,
    scenario,
    product_context,
    tags,
    source,
    configs
)
values
(
    '10000000-0000-0000-0000-000000000001',
    'The Price Negotiator',
    'Convince a finance leader to consider a pilot despite a pricing objection.',
    'Objection Handling',
    'MEDIUM',
    'ONE_ON_ONE',
    4,
    'Secure approval for a pilot.',
    'A pricing evaluation meeting with a sceptical finance head.',
    'Fictional HR SaaS with defined features and pricing.',
    array['Pricing', 'Negotiation', 'SaaS'],
    'INTERNAL',
    '{"starter_prompt":"The buyer opens by saying the price is too high."}'::jsonb
),
(
    '10000000-0000-0000-0000-000000000002',
    'The Executive Boardroom',
    'Present a SaaS solution to a CEO, CTO and CFO with different priorities.',
    'Executive Selling',
    'HARD',
    'BOARDROOM',
    6,
    'Earn agreement on a next step for a controlled pilot.',
    'An executive evaluation meeting where the committee is deciding whether to explore the solution.',
    'Fictional B2B workflow SaaS with a measurable implementation plan.',
    array['Discovery', 'Boardroom', 'Value Selling'],
    'INTERNAL',
    '{"starter_prompt":"The CEO asks for the business case before the other stakeholders weigh in."}'::jsonb
)
on conflict (id) do nothing;

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

insert into public.participant (
    id,
    challenge_id,
    name,
    designation,
    company,
    personality,
    communication_style,
    hidden_motivation,
    objections,
    decision_authority,
    sort_order
)
values
(
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Maya Shah',
    'CFO',
    'Northstar Labs',
    'Sceptical and analytical',
    'Direct and concise',
    'Wants proof that the pilot can be measured without creating financial risk.',
    '["The price is too high", "We can build this internally"]'::jsonb,
    'Decision-maker',
    0
),
(
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'Arjun Mehta',
    'CEO',
    'Northstar Labs',
    'Outcome-focused and impatient',
    'Direct and high-level',
    'Wants a clear business outcome and a low-friction next step.',
    '["What changes for the business?", "Why now?"]'::jsonb,
    'Decision-maker',
    0
),
(
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'Nisha Rao',
    'CTO',
    'Northstar Labs',
    'Analytical and cautious',
    'Detailed and reserved',
    'Needs confidence that implementation and security risks are contained.',
    '["How will integration work?", "What about security?"]'::jsonb,
    'Evaluator',
    1
),
(
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000002',
    'Kabir Menon',
    'CFO',
    'Northstar Labs',
    'Pragmatic and numbers-driven',
    'Confrontational and precise',
    'Needs a credible cost-to-value case before supporting a pilot.',
    '["What is the expected payback?", "How do we cap the cost?"]'::jsonb,
    'Influencer',
    2
)
on conflict (id) do nothing;
