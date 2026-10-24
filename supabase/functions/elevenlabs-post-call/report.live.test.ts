import assert from 'node:assert/strict'
import { buildReport } from '../_shared/report.ts'

// Opt-in provider smoke test. Uses invented practice dialogue; never writes to the database.
Deno.test({
  name: 'Gemini generates a structured coaching report with valid transcript evidence',
  ignore: Deno.env.get('REPORT_LIVE') !== '1',
  fn: async () => {
    const report = await buildReport({
      challenge: { title: 'Synthetic report verification', call_type: 'ONE_ON_ONE', objective: 'Understand the budget and agree on a follow-up' },
      participants: [{ id: 'buyer', name: 'Alex', designation: 'Manager', company: 'Example' }],
      productContext: null, mode: 'BATTLE', durationSeconds: 70,
      transcript: [
        { id: 'turn-0', order: 0, speaker: 'agent', participantId: 'buyer', text: 'We have a limited budget.', timeInCallSecs: 0 },
        { id: 'turn-1', order: 1, speaker: 'user', participantId: null, text: 'What does the budget need to cover?', timeInCallSecs: 10 },
        { id: 'turn-2', order: 2, speaker: 'agent', participantId: 'buyer', text: 'Licences and onboarding, and we need a decision next month.', timeInCallSecs: 20 },
        { id: 'turn-3', order: 3, speaker: 'user', participantId: null, text: 'What is the main problem you want to solve?', timeInCallSecs: 30 },
        { id: 'turn-4', order: 4, speaker: 'agent', participantId: 'buyer', text: 'Too much manual reporting.', timeInCallSecs: 40 },
        { id: 'turn-5', order: 5, speaker: 'user', participantId: null, text: 'Could we meet next week to map that process and review options?', timeInCallSecs: 50 },
        { id: 'turn-6', order: 6, speaker: 'agent', participantId: 'buyer', text: 'Yes, Tuesday works.', timeInCallSecs: 60 },
      ],
    })
    assert.ok(report.summary)
    assert.ok(report.generator.model)
    assert.equal(report.skills.length, 4)
    assert.equal(report.productChecks, null)
    const known = new Set(Array.from({ length: 7 }, (_, i) => `turn-${i}`))
    for (const item of [report.priorityImprovement, ...report.moreImprovements]) {
      if (item) assert.ok(item.turnIds.every((id) => known.has(id)))
    }
    console.log(`Structured report generated with ${report.generator.model}`)
  },
})
