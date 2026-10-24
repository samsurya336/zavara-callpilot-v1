import assert from 'node:assert/strict'
import { buildAgentConfig } from './agent-config.ts'
import {
  createAgent,
  deleteAgent,
  getConversationToken,
  getSignedUrl,
  updateAgent,
} from './elevenlabs.ts'
import { boardroomParticipants, challengeFixture } from './test-fixtures.ts'

// Opt-in: creates a real agent in the ElevenLabs workspace, then deletes it. Needs
// ELEVENLABS_LIVE=1, ELEVENLABS_API_KEY and ELEVENLABS_DEFAULT_VOICE_ID.
Deno.test({
  name: 'ElevenLabs accepts the generated agent and issues a signed URL',
  ignore: Deno.env.get('ELEVENLABS_LIVE') !== '1',
  fn: async () => {
    const voiceId = Deno.env.get('ELEVENLABS_DEFAULT_VOICE_ID')!
    const participants = boardroomParticipants.map((participant) => ({
      ...participant,
      voice_configs: { voiceId },
    }))
    const challenge = challengeFixture({ call_type: 'BOARDROOM', title: 'Live test (delete me)' })
    const config = buildAgentConfig(challenge, participants, voiceId)

    const agentId = await createAgent(config)
    try {
      await updateAgent(agentId, config)
      const { signedUrl, conversationId } = await getSignedUrl(agentId)
      assert.match(signedUrl, /^wss:\/\//)
      const rtc = await getConversationToken(agentId)
      assert.ok(rtc.conversationToken)
      assert.match(rtc.conversationId, /^conv_/)
      console.log(`conversationId returned: ${conversationId ?? 'none'}`)
    } finally {
      await deleteAgent(agentId)
    }
  },
})
