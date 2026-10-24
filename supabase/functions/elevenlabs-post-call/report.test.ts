import assert from 'node:assert/strict'
import { buildReport, type GenerateRequest, type ReportInput } from '../_shared/report.ts'
import type { TranscriptTurn } from '../_shared/transcript.ts'

function turn(order: number, speaker: 'user' | 'agent', text: string): TranscriptTurn {
  return {
    id: `turn-${order}`,
    order,
    speaker,
    participantId: speaker === 'agent' ? 'cfo' : null,
    text,
    timeInCallSecs: order * 5,
  }
}

function input(overrides: Partial<ReportInput> = {}): ReportInput {
  return {
    challenge: { title: 'The Price Negotiator', call_type: 'ONE_ON_ONE', objective: 'Win a pilot' },
    participants: [{
      id: 'cfo',
      name: 'Priya Shah',
      designation: 'CFO',
      company: 'Northwind',
      hidden_motivation: 'Needs to cut tooling spend by 15%',
    }],
    productContext: null,
    mode: 'BATTLE',
    durationSeconds: 95,
    transcript: [
      turn(0, 'agent', 'Our budget is tight this year.'),
      turn(1, 'user', 'But we have many features, honestly.'),
      turn(2, 'agent', 'Features are not the issue.'),
      turn(3, 'user', 'Can I ask what the budget needs to cover?'),
      turn(4, 'agent', 'Licences and onboarding.'),
      turn(5, 'user', 'Then a small pilot could fit.'),
    ],
    ...overrides,
  }
}

const improvement = {
  title: 'Ask what the budget covers before pitching features',
  turnIds: ['turn-1', 'turn-99'],
  quote: 'we have MANY features',
  whatToChange: 'You answered a budget concern with features.',
  whyItMatters: 'The budget concern stayed open.',
  tryThis: 'Ask what the budget needs to cover.',
  exampleResponse: 'When you say tight, is it the total or the timing?',
  retryTurnId: 'turn-1',
}

function fakeModel(output: unknown, requests: GenerateRequest[] = []) {
  return (request: GenerateRequest) => {
    requests.push(request)
    return Promise.resolve({ output, model: 'test-model', promptTokens: 10, outputTokens: 20 })
  }
}

Deno.test('report keeps only evidence that exists in the saved transcript', async () => {
  const requests: GenerateRequest[] = []
  const report = await buildReport(
    input(),
    fakeModel({
      evidenceLevel: 'FULL',
      evidenceNote: null,
      summary: ' The buyer worried about budget. ',
      outcomeLabel: 'Pilot considered',
      outcomeExplanation: 'The buyer agreed to discuss a pilot.',
      skills: [
        { key: 'discovery', score: 4, reason: 'Asked about the budget.' },
        { key: 'communication', score: 3, reason: 'Clear.' },
        { key: 'objectionHandling', score: 9, reason: 'Out of range.' },
      ],
      priorityImprovement: improvement,
      moreImprovements: [
        {
          ...improvement,
          title: 'Invented quote',
          quote: 'I guarantee a discount',
          retryTurnId: 'turn-0',
        },
        { ...improvement, title: 'No real turns', turnIds: ['turn-42'] },
        { ...improvement, title: 'Over the limit' },
      ],
      strengths: [
        {
          title: 'Asked a budget question',
          reason: 'It surfaced the real need.',
          turnId: 'turn-3',
        },
        { title: 'Unknown turn', reason: 'x', turnId: 'turn-77' },
      ],
      nextStep: { kind: 'RETRY_TURN', label: 'Retry your budget answer', turnId: 'turn-1' },
    }, requests),
  )

  assert.match(requests[0].prompt, /turn-1 \[0:05\] SALESPERSON: But we have many features/)
  assert.match(requests[0].prompt, /Priya Shah \(CFO\): Our budget is tight/)
  assert.equal(report.summary, 'The buyer worried about budget.')
  assert.equal(report.evidence.level, 'FULL')
  assert.deepEqual(report.priorityImprovement?.turnIds, ['turn-1'])
  assert.equal(report.priorityImprovement?.quote, 'we have MANY features')
  assert.deepEqual(report.moreImprovements.map((item) => item.title), [
    'Invented quote',
    'Over the limit',
  ])
  assert.equal(report.moreImprovements[0].quote, null)
  assert.equal(report.moreImprovements[0].retryTurnId, null)
  assert.deepEqual(report.strengths.map((item) => item.turnId), ['turn-3'])
  assert.deepEqual(report.skills.map((skill) => [skill.key, skill.score]), [
    ['discovery', 4],
    ['communication', 3],
    ['objectionHandling', null],
    ['valueExplanation', null],
  ])
  assert.deepEqual(report.overall.score, 70)
  assert.equal(report.stakeholders, null)
  assert.equal(report.productChecks, null)
  assert.deepEqual(report.nextStep, {
    kind: 'RETRY_TURN',
    label: 'Retry your budget answer',
    turnId: 'turn-1',
  })
  assert.equal(report.generator.model, 'test-model')
})

Deno.test('report schema offers only real turns, boardroom and product sections', async () => {
  const requests: GenerateRequest[] = []
  const boardroom = input({
    challenge: { title: 'Board', call_type: 'BOARDROOM' },
    productContext: 'Pilot costs $500 a month.',
  })
  const report = await buildReport(
    boardroom,
    fakeModel({
      evidenceLevel: 'PARTIAL',
      skills: [{ key: 'productAccuracy', score: 5, reason: 'Matched the brief.' }],
      stakeholders: [
        {
          participantId: 'cfo',
          mainConcern: 'Budget',
          addressed: 'Partly',
          stillOpen: 'Price',
          turnIds: ['turn-0'],
        },
        {
          participantId: 'someone-else',
          mainConcern: 'x',
          addressed: 'x',
          stillOpen: 'x',
          turnIds: [],
        },
      ],
      productChecks: [
        {
          claim: 'A pilot could fit',
          turnId: 'turn-5',
          verdict: 'UNVERIFIED',
          explanation: 'No price was given.',
        },
        {
          claim: 'Buyer line',
          turnId: 'turn-4',
          verdict: 'SUPPORTED',
          explanation: 'Not the salesperson.',
        },
      ],
    }, requests),
  )

  const schema = requests[0].schema as { properties: Record<string, any> }
  assert.deepEqual(
    schema.properties.strengths.items.properties.turnId.enum,
    ['turn-0', 'turn-1', 'turn-2', 'turn-3', 'turn-4', 'turn-5'],
  )
  assert.deepEqual(
    schema.properties.nextStep.properties.turnId.anyOf[0].enum,
    ['turn-1', 'turn-3', 'turn-5'],
  )
  assert.ok(schema.properties.stakeholders)
  assert.ok(schema.properties.productChecks)
  assert.match(requests[0].prompt, /Product brief \(the only verified product facts\)/)
  assert.deepEqual(report.stakeholders?.map((item) => item.name), ['Priya Shah'])
  assert.deepEqual(report.productChecks?.map((item) => item.turnId), ['turn-5'])
  assert.equal(report.skills.at(-1)?.key, 'productAccuracy')
  assert.equal(report.overall.score, null)
  assert.equal(report.nextStep.kind, 'PRACTISE_SKILL')
})

Deno.test('a call where the user never spoke gets an unscored report without a model call', async () => {
  const requests: GenerateRequest[] = []
  const report = await buildReport(
    input({ transcript: [turn(0, 'agent', 'Hi, go ahead.')] }),
    fakeModel({}, requests),
  )

  assert.equal(requests.length, 0)
  assert.equal(report.evidence.level, 'INSUFFICIENT')
  assert.equal(report.overall.score, null)
  assert.ok(report.skills.every((skill) => skill.score === null))
  assert.equal(report.priorityImprovement, null)
})

Deno.test('a short call cannot claim full evidence', async () => {
  const report = await buildReport(
    input({ transcript: [turn(0, 'agent', 'Hi.'), turn(1, 'user', 'Hello, quick question.')] }),
    fakeModel({ evidenceLevel: 'FULL' }),
  )
  assert.equal(report.evidence.level, 'PARTIAL')
})
