import assert from 'node:assert/strict'
import {
  buildAgentConfig,
  callSpeakers,
  configHash,
  publicParticipants,
  speakingParticipants,
  voiceLabels,
} from './agent-config.ts'
import { boardroomParticipants, challengeFixture, participantFixture } from './test-fixtures.ts'

Deno.test('one-on-one agent uses the lead voice, call limit and signed-URL auth', () => {
  const config = buildAgentConfig(challengeFixture(), [participantFixture()], undefined)
  const { agent, tts, conversation } = config.conversation_config

  assert.equal(tts.voice_id, 'voice-priya')
  assert.equal(tts.stability, 0.6)
  assert.equal('similarity_boost' in tts, false)
  assert.deepEqual(tts.supported_voices, [])
  assert.equal(conversation.max_duration_seconds, 300)
  assert.equal(config.platform_settings.auth.enable_auth, true)
  assert.match(agent.dynamic_variables.dynamic_variable_placeholders.opening_line, /^Hi \{\{user_name\}\}, I'm Priya Shah, CFO/)
  assert.equal(agent.disable_first_message_interruptions, true)
  assert.match(agent.prompt.prompt, /Needs to cut tooling spend by 15%/)
  assert.match(agent.prompt.prompt, /Too expensive; We already use spreadsheets/)
  assert.doesNotMatch(agent.prompt.prompt, /Boardroom rules/)
})

Deno.test('boardroom agent gives each extra stakeholder a labelled voice', () => {
  const challenge = challengeFixture({ call_type: 'BOARDROOM' })
  const config = buildAgentConfig(challenge, boardroomParticipants, 'voice-default')
  const { agent, tts } = config.conversation_config

  assert.equal(tts.voice_id, 'voice-default')
  assert.deepEqual(tts.supported_voices.map(({ label, voice_id }) => ({ label, voice_id })), [
    { label: 'Arjun2', voice_id: 'voice-cto' },
    { label: 'Priya', voice_id: 'voice-priya' },
  ])
  assert.match(agent.prompt.prompt, /Arjun Mehta speaks without any tag/)
  assert.match(agent.prompt.prompt, /<Arjun2>\.\.\.<\/Arjun2>/)
  assert.match(agent.dynamic_variables.dynamic_variable_placeholders.opening_line, /Arjun Rao, our CTO, and Priya Shah, our CFO/)
})

Deno.test('missing voice without a default is a configuration error', () => {
  const participant = participantFixture({ voice_configs: null })
  assert.throws(() => buildAgentConfig(challengeFixture(), [participant], undefined), /No voice/)
})

Deno.test('one-on-one speaks with the lead only', () => {
  assert.equal(speakingParticipants(challengeFixture(), boardroomParticipants).length, 1)
  const boardroom = challengeFixture({ call_type: 'BOARDROOM' })
  assert.equal(speakingParticipants(boardroom, boardroomParticipants).length, 3)
})

Deno.test('labels are tag-safe and unique', () => {
  const participants = [
    participantFixture({ name: "D'Souza" }),
    participantFixture({ name: '  ' }),
    participantFixture({ name: 'DSouza Kumar' }),
  ]
  assert.deepEqual(voiceLabels(participants), ['DSouza', 'Speaker2', 'DSouza2'])
})

Deno.test('public participants and speakers never include hidden fields', () => {
  const serialised = JSON.stringify([
    publicParticipants(boardroomParticipants),
    callSpeakers(boardroomParticipants),
  ])
  assert.doesNotMatch(serialised, /tooling spend|integration project|Too expensive/)
  assert.deepEqual(callSpeakers(boardroomParticipants).map(({ label, lead }) => [label, lead]), [
    ['Arjun', true],
    ['Arjun2', false],
    ['Priya', false],
  ])
})

Deno.test('config hash is stable and changes when the persona changes', async () => {
  const build = (motivation: string) =>
    buildAgentConfig(
      challengeFixture(),
      [participantFixture({ hidden_motivation: motivation })],
      undefined,
    )
  assert.equal(await configHash(build('A')), await configHash(build('A')))
  assert.notEqual(await configHash(build('A')), await configHash(build('B')))
})
