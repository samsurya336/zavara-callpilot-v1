import assert from 'node:assert/strict'
import {
  buildAgentInput,
  excerptFound,
  type GenerationRequest,
  MAX_KNOWLEDGE_CHARS,
  parseAgentOutput,
  SLOTS,
  trimKnowledge,
} from './challenges.ts'

const content = `# LedgerLoop

**Pricing:** Growth plan ₹4,50,000 per year for up to 5,000 invoices per month.
Integrations: native connectors for Tally, SAP Business One and Zoho Books.
Implementation: typically 4 to 6 weeks including ERP sync and approval-rule setup.`

const request: GenerationRequest = {
  slots: SLOTS,
  difficulty: null,
  goal: null,
  avoidTitles: ['The Old Title'],
  knowledge: { title: 'LedgerLoop', content },
}

const person = (designation: string) => ({
  name: `${designation} Person`,
  designation,
  company: 'Brightwave Logistics',
  personality: 'Sceptical',
  communication_style: 'Direct',
  decision_authority: 'Decision-maker',
  hidden_motivation: 'Wants a quick win before the board meeting.',
  objections: ['We tried a tool like this before.'],
})

const challenge = (slot: number, callType: string, title: string, people: unknown[]) => ({
  slot,
  challenge: {
    title,
    description: 'A finance team drowning in invoices.',
    category: 'Discovery',
    difficulty: 'HARD',
    call_type: callType,
    duration_minutes: 30,
    objective: 'Agree a demo.',
    scenario: 'A first call with a busy finance head.',
    starter_prompt: 'The buyer asks why this matters.',
    product_context: 'Growth plan costs ₹4,50,000 per year.',
    tags: ['Discovery', 'Finance'],
  },
  participants: people,
  grounding: [
    'Pricing: Growth plan ₹4,50,000 per year',
    'native connectors for Tally...Zoho Books',
  ],
})

Deno.test('agent input uses snake_case slots and passes the knowledge through', () => {
  const input = buildAgentInput(request)
  assert.deepEqual(input.slots.map((slot) => slot.call_type), [
    'one_on_one',
    'one_on_one',
    'boardroom',
  ])
  assert.equal(input.knowledge.content, content)
  assert.deepEqual(input.avoid_titles, ['The Old Title'])
})

Deno.test('valid challenges are parsed from a JSON string and clamped', () => {
  const output = JSON.stringify({
    challenges: [
      challenge(1, 'ONE_ON_ONE', 'The Spreadsheet Loyalist', [person('Finance Head')]),
      challenge(2, 'ONE_ON_ONE', 'The Discount Hunter', [person('Procurement Lead')]),
      challenge(3, 'BOARDROOM', 'The Pilot Committee', [
        person('CEO'),
        person('CTO'),
        person('Chief Financial Officer'),
      ]),
    ],
  })
  const parsed = parseAgentOutput({ result: `Here you go:\n${output}` }, request)
  assert.equal(parsed.kind, 'challenges')
  if (parsed.kind !== 'challenges') return
  assert.deepEqual(parsed.invalid, [])
  assert.deepEqual(parsed.valid.map((item) => item.challenge.duration_minutes), [6, 6, 8])
  assert.equal(parsed.valid[2].participants.length, 3)
  assert.equal(parsed.valid[0].starterPrompt, 'The buyer asks why this matters.')
  assert.equal(parsed.valid[0].grounding.length, 2)
})

Deno.test('invalid slots are reported without dropping valid ones', () => {
  const parsed = parseAgentOutput({
    challenges: [
      challenge(1, 'ONE_ON_ONE', 'The Old Title', [person('Finance Head')]),
      challenge(2, 'ONE_ON_ONE', 'Two Buyers', [person('A'), person('B')]),
      challenge(3, 'BOARDROOM', 'Wrong Order', [person('CFO'), person('CTO'), person('CEO')]),
    ],
  }, { ...request, difficulty: 'EASY' })
  assert.equal(parsed.kind, 'challenges')
  if (parsed.kind !== 'challenges') return
  assert.deepEqual(parsed.valid, [])
  assert.deepEqual(parsed.invalid.map((item) => item.slot), [1, 2, 3])
})

Deno.test('requested difficulty wins and duplicate titles in one response are rejected', () => {
  const parsed = parseAgentOutput({
    challenges: [
      challenge(1, 'ONE_ON_ONE', 'Same Title', [person('Finance Head')]),
      challenge(2, 'ONE_ON_ONE', 'same title', [person('Procurement Lead')]),
    ],
  }, { ...request, slots: SLOTS.slice(0, 2), difficulty: 'EASY' })
  if (parsed.kind !== 'challenges') throw new Error(parsed.kind)
  assert.equal(parsed.valid[0].challenge.difficulty, 'EASY')
  assert.deepEqual(parsed.invalid, [{ slot: 2, reason: 'title "same title" is already used' }])
})

Deno.test('ungrounded excerpts are dropped and a challenge without any fails', () => {
  const item = challenge(1, 'ONE_ON_ONE', 'Made Up Facts', [person('Finance Head')])
  item.grounding = ['Free forever for every customer']
  const parsed = parseAgentOutput({ challenges: [item] }, { ...request, slots: [SLOTS[0]] })
  if (parsed.kind !== 'challenges') throw new Error(parsed.kind)
  assert.deepEqual(parsed.invalid, [
    { slot: 1, reason: 'no grounding excerpt matches the knowledge' },
  ])
})

Deno.test('special agent answers are recognised', () => {
  assert.equal(
    parseAgentOutput('{"error":"NOT_ENOUGH_PRODUCT_INFORMATION"}', request).kind,
    'not_enough_information',
  )
  assert.equal(parseAgentOutput('Sorry, I cannot help.', request).kind, 'unreadable')
})

Deno.test('excerpts ignore Markdown, quotes and spacing but not wording', () => {
  assert.ok(excerptFound('Pricing: Growth plan ₹4,50,000 per year', content))
  assert.ok(excerptFound('typically 4 to 6 weeks…approval-rule setup', content))
  assert.ok(!excerptFound('typically 2 weeks', content))
  assert.ok(!excerptFound('...', content))
})

Deno.test('long knowledge is cut at a line break', () => {
  const long = `${'a'.repeat(MAX_KNOWLEDGE_CHARS - 10)}\n${'b'.repeat(100)}`
  assert.equal(trimKnowledge(long), 'a'.repeat(MAX_KNOWLEDGE_CHARS - 10))
  assert.equal(trimKnowledge(content), content)
})
