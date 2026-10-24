import assert from 'node:assert/strict'
import { getConversationToken } from './elevenlabs.ts'

Deno.test('WebRTC token request authenticates server-side and requires a conversation ID', async () => {
  const original = globalThis.fetch
  const key = Deno.env.get('ELEVENLABS_API_KEY')
  Deno.env.set('ELEVENLABS_API_KEY', 'test-secret')
  try {
    globalThis.fetch = (url, init) => {
      assert.equal(new URL(String(url)).pathname, '/v1/convai/conversation/token')
      assert.equal(new URL(String(url)).searchParams.get('agent_id'), 'agent_test')
      assert.equal(new Headers(init?.headers).get('xi-api-key'), 'test-secret')
      return Promise.resolve(Response.json({ token: 'rtc-token', conversation_id: 'conv_test' }))
    }
    assert.deepEqual(await getConversationToken('agent_test'), {
      conversationToken: 'rtc-token',
      conversationId: 'conv_test',
    })
    globalThis.fetch = () => Promise.resolve(Response.json({ token: 'rtc-token' }))
    await assert.rejects(() => getConversationToken('agent_test'), /Incomplete voice session/)
  } finally {
    globalThis.fetch = original
    if (key === undefined) Deno.env.delete('ELEVENLABS_API_KEY')
    else Deno.env.set('ELEVENLABS_API_KEY', key)
  }
})
