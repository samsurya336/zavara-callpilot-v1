import assert from 'node:assert/strict'
import type { CallSpeaker } from '../_shared/calls.ts'
import { hmacHex, verifySignature } from './signature.ts'
import { mapTranscript } from './transcript.ts'

const speakers: CallSpeaker[] = [
  { participantId: 'ceo', name: 'Arjun Mehta', label: 'Arjun', lead: true },
  { participantId: 'cfo', name: 'Priya Shah', label: 'Priya', lead: false },
]

Deno.test('transcript maps tags to participants and splits mixed replies', () => {
  const turns = mapTranscript([
    { role: 'agent', message: 'Hi, go ahead.', time_in_call_secs: 0 },
    { role: 'user', message: 'Thanks for your time.', time_in_call_secs: 3 },
    { role: 'agent', message: null, time_in_call_secs: 5 },
    { role: 'agent', message: '<Priya>What does it cost?</Priya>', time_in_call_secs: 8 },
    { role: 'agent', message: 'Fair point. <Priya>Still pricey.</Priya>', time_in_call_secs: 12 },
    { role: 'agent', message: '<Unknown>Hello</Unknown>', time_in_call_secs: 15 },
  ], speakers)

  assert.deepEqual(
    turns.map(({ id, speaker, participantId, text }) => [id, speaker, participantId, text]),
    [
      ['turn-0', 'agent', 'ceo', 'Hi, go ahead.'],
      ['turn-1', 'user', null, 'Thanks for your time.'],
      ['turn-2', 'agent', 'cfo', 'What does it cost?'],
      ['turn-3', 'agent', 'ceo', 'Fair point.'],
      ['turn-4', 'agent', 'cfo', 'Still pricey.'],
      ['turn-5', 'agent', 'ceo', 'Hello'],
    ],
  )
  assert.equal(turns[4].timeInCallSecs, 12)
})

Deno.test('signature accepts a valid header and rejects tampering, staleness and junk', async () => {
  const body = '{"type":"post_call_transcription"}'
  const now = 1_800_000_000
  const valid = `t=${now},v0=${await hmacHex('secret', `${now}.${body}`)}`

  assert.equal(await verifySignature(body, valid, 'secret', now + 60), true)
  assert.equal(
    await verifySignature(body, `t=${now},v0=bad,${valid.split(',')[1]}`, 'secret', now),
    true,
  )
  assert.equal(await verifySignature(`${body} `, valid, 'secret', now), false)
  assert.equal(await verifySignature(body, valid, 'other-secret', now), false)
  assert.equal(await verifySignature(body, valid, 'secret', now + 31 * 60), false)
  assert.equal(await verifySignature(body, null, 'secret', now), false)
  assert.equal(await verifySignature(body, 'v0=abc', 'secret', now), false)
})
