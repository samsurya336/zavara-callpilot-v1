import type { ProviderConversation } from '../_shared/post-call.ts'
import type { AgentConfig } from './agent-config.ts'

const API_BASE = 'https://api.elevenlabs.io/v1/convai'
const TIMEOUT_MS = 10_000

export class ElevenLabsError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const apiKey = Deno.env.get('ELEVENLABS_API_KEY')
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not set')

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const text = await response.text()
  if (!response.ok) {
    const method = init.method ?? 'GET'
    throw new ElevenLabsError(
      response.status,
      `ElevenLabs ${method} ${path.split('?')[0]} failed: ${response.status} ${text}`,
    )
  }
  return (text ? JSON.parse(text) : undefined) as T
}

export async function createAgent(config: AgentConfig) {
  const { agent_id } = await request<{ agent_id: string }>('/agents/create', {
    method: 'POST',
    body: JSON.stringify(config),
  })
  return agent_id
}

// Sends the full config so nothing depends on how ElevenLabs merges nested fields.
export async function updateAgent(agentId: string, config: AgentConfig) {
  await request(`/agents/${encodeURIComponent(agentId)}`, {
    method: 'PATCH',
    body: JSON.stringify(config),
  })
}

export async function deleteAgent(agentId: string) {
  await request(`/agents/${encodeURIComponent(agentId)}`, { method: 'DELETE' })
}

export async function getConversation(conversationId: string) {
  return await request<ProviderConversation>(
    `/conversations/${encodeURIComponent(conversationId)}`,
  )
}

export async function getSignedUrl(agentId: string) {
  const params = new URLSearchParams({ agent_id: agentId, include_conversation_id: 'true' })
  const body = await request<{ signed_url: string; conversation_id?: string }>(
    `/conversation/get-signed-url?${params}`,
  )
  // The docs do not show where include_conversation_id puts the ID, so accept either location.
  const conversationId = body.conversation_id ??
    new URL(body.signed_url).searchParams.get('conversation_id')
  return { signedUrl: body.signed_url, conversationId }
}
