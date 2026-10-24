import assert from 'node:assert/strict'
import { branchOpeningLine, branchPrefix, branchPreview, loadBranch, resumeContext } from './branch.ts'
import { continuedTranscript, type TranscriptTurn } from '../_shared/transcript.ts'
import { challengeFixture, participantFixture } from './test-fixtures.ts'

const turns: TranscriptTurn[] = ['agent', 'user', 'agent', 'user'].map((speaker, order) => ({
  id: `turn-${order}`,
  order,
  speaker: speaker as 'agent' | 'user',
  participantId: null,
  text: ['What do you offer?', 'Old mistake', 'Later secret', 'Later answer'][order],
  timeInCallSecs: order,
}))

Deno.test('branch excludes the selected answer and every later turn without changing the source', () => {
  const prefix = branchPrefix(turns, 'turn-1')!
  assert.deepEqual(prefix, [turns[0]])
  assert.equal(turns.length, 4)
  const context = resumeContext(prefix, [participantFixture()])
  assert.match(context, /What do you offer/)
  assert.doesNotMatch(context, /Old mistake|Later secret|Later answer/)
  assert.equal(branchPrefix(turns, 'turn-0'), null)
  assert.equal(branchPrefix(turns, 'missing'), null)
})

Deno.test('preview exposes only public challenge and participant fields', () => {
  const preview = branchPreview({
    challenge: challengeFixture(),
    participants: [participantFixture()],
    prefix: [turns[0]],
    challengeId: 'challenge',
    mode: 'BATTLE',
  })
  assert.doesNotMatch(JSON.stringify(preview), /hidden_motivation|objections|voice_configs|configs/)
})

Deno.test('branch opening repeats the entire last buyer reply without earlier or future dialogue', () => {
  const source = [
    turns[0], turns[1],
    { ...turns[2], text: 'The price is high. What does it include? Can we start smaller?' },
    turns[3],
  ]
  assert.equal(
    branchOpeningLine(branchPrefix(source, 'turn-3')!, [participantFixture()]),
    'The price is high. What does it include? Can we start smaller?',
  )
  assert.equal(branchOpeningLine([], [participantFixture()]), "Go ahead, I'm listening.")
})

Deno.test('branch opening preserves all final boardroom segments and their voices', () => {
  const lead = participantFixture({ id: 'lead', name: 'Priya Shah' })
  const other = participantFixture({ id: 'other', name: 'Arjun Rao' })
  assert.equal(branchOpeningLine([
    turns[1],
    { ...turns[2], participantId: 'lead', text: 'What is the total cost?' },
    { ...turns[2], participantId: 'other', text: 'And how long does setup take?' },
  ], [lead, other]), 'What is the total cost?\n<Arjun>And how long does setup take?</Arjun>')
})

Deno.test('saved continuation has the prefix and new answer with unique stable turn IDs', () => {
  const prefix = branchPrefix(turns, 'turn-1')!
  const current = [{ ...turns[1], id: 'turn-0', order: 0, text: 'Better answer' }]
  const saved = continuedTranscript(prefix, current)
  assert.deepEqual(saved.map((turn) => [turn.id, turn.text]), [
    ['turn-0', 'What do you offer?'],
    ['turn-1', 'Better answer'],
  ])
  assert.deepEqual(continuedTranscript(prefix, current), saved)
  assert.equal(prefix.length, 1)
  assert.equal(current[0].id, 'turn-0')
})

Deno.test('source lookup is constrained to the authenticated owner and rejects active calls', async () => {
  const filters: unknown[] = []
  const query = {
    select() {
      return this
    },
    eq(...args: unknown[]) {
      filters.push(args)
      return this
    },
    maybeSingle() {
      return Promise.resolve({ data: { status: 'ACTIVE' }, error: null })
    },
  }
  const db = { from: () => query } as unknown as Parameters<typeof loadBranch>[0]
  assert.equal(await loadBranch(db, 'owner', 'parent', 'turn-1'), null)
  assert.deepEqual(filters, [['id', 'parent'], ['user_id', 'owner']])
})
