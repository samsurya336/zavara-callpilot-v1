import {
  authenticate,
  corsHeaders,
  jsonResponse,
  runInBackground,
  serviceClient,
} from '../_shared/index.ts'
import { generateReport, saveConversation } from '../_shared/post-call.ts'
import {
  type AgentConfig,
  buildAgentConfig,
  callSpeakers,
  configHash,
  publicParticipants,
  speakingParticipants,
} from './agent-config.ts'
import {
  activateCallSession,
  type AgentRef,
  type CallMode,
  type ChallengeRow,
  closeCallSessions,
  insertCallSession,
  loadAgentRef,
  loadChallenge,
  loadEndedConversationId,
  saveAgentRef,
} from './db.ts'
import {
  createAgent,
  deleteAgent,
  ElevenLabsError,
  getConversation,
  getSignedUrl,
  updateAgent,
} from './elevenlabs.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MODES: CallMode[] = ['ASSIST', 'BATTLE']
// ElevenLabs usually finishes processing a conversation within seconds of hang-up. Polling stops
// well inside the Edge Function wall-clock limit, leaving room for the report.
const SYNC_POLL_MS = 4_000
const SYNC_ATTEMPTS = 15

type Db = ReturnType<typeof serviceClient>

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Use POST' }, 405)
  }

  try {
    const user = await authenticate(request)
    if (user instanceof Response) return user

    const body = await request.json().catch(() => null)
    if (body?.action === 'activate') {
      if (
        typeof body.callSessionId !== 'string' || !UUID.test(body.callSessionId) ||
        typeof body.conversationId !== 'string' || body.conversationId.length < 3
      ) {
        return jsonResponse({ error: 'callSessionId and conversationId are required' }, 400)
      }
      const result = await activateCallSession(
        serviceClient(),
        user.id,
        body.callSessionId,
        body.conversationId,
      )
      if (result === 'CONFLICT') {
        return jsonResponse({ error: 'You already have an active call' }, 409)
      }
      if (result === 'NOT_FOUND') return jsonResponse({ error: 'Call session not found' }, 404)
      return jsonResponse({ active: true })
    }
    if (body?.action === 'end') {
      if (typeof body.callSessionId !== 'string' || !UUID.test(body.callSessionId)) {
        return jsonResponse({ error: 'callSessionId is required' }, 400)
      }
      const db = serviceClient()
      await closeCallSessions(db, user.id, body.callSessionId)
      runInBackground(syncEndedCall(db, user.id, body.callSessionId))
      return jsonResponse({ ended: true })
    }

    const challengeId = body?.challengeId
    if (typeof challengeId !== 'string' || !UUID.test(challengeId)) {
      return jsonResponse({ error: 'challengeId must be a UUID' }, 400)
    }
    if (body.mode !== undefined && !MODES.includes(body.mode)) {
      return jsonResponse({ error: 'mode must be ASSIST or BATTLE' }, 400)
    }

    const db = serviceClient()
    const loaded = await loadChallenge(db, challengeId)
    const challenge = loaded?.challenge
    if (
      !loaded || !challenge?.is_active ||
      (challenge.source === 'KNOWLEDGE_BASE' && challenge.created_by !== user.id)
    ) {
      return jsonResponse({ error: 'Challenge not found' }, 404)
    }
    const participants = speakingParticipants(challenge, loaded.participants)
    if (
      participants.length === 0 ||
      (challenge.call_type === 'BOARDROOM' && participants.length < 2)
    ) {
      return jsonResponse({ error: 'Challenge does not have enough participants' }, 422)
    }
    const mode: CallMode = body.mode ?? 'BATTLE'

    // Task 11 guard: check the account allowance and event budget here, before billable work.

    const config = buildAgentConfig(
      challenge,
      participants,
      Deno.env.get('ELEVENLABS_DEFAULT_VOICE_ID'),
    )
    const hash = await configHash(config)
    let agent = await ensureAgent(db, challenge, config, hash)
    let signed
    try {
      signed = await getSignedUrl(agent.agentId)
    } catch (error) {
      if (!(error instanceof ElevenLabsError && error.status === 404)) throw error
      // The cached agent was deleted on ElevenLabs; replace it.
      agent = await createAndStoreAgent(db, challenge, config, hash, agent.agentId)
      signed = await getSignedUrl(agent.agentId)
    }
    if (!signed.conversationId) {
      console.warn(`No conversation ID for agent ${agent.agentId}; webhook cannot match this call`)
    }

    // Starting a call supersedes any call the user left open (closed tab, lost connection).
    await closeCallSessions(db, user.id)
    const { configs: _configs, ...challengeSnapshot } = challenge
    const callSessionId = await insertCallSession(db, {
      userId: user.id,
      challengeId,
      mode,
      providerSessionId: signed.conversationId,
      metadata: {
        snapshot: { challenge: challengeSnapshot, participants },
        speakers: callSpeakers(participants),
        agentId: agent.agentId,
        configHash: agent.configHash,
      },
    })
    if (!callSessionId) {
      return jsonResponse({ error: 'You already have an active call' }, 409)
    }

    return jsonResponse({
      callSessionId,
      signedUrl: signed.signedUrl,
      mode,
      challenge: {
        id: challenge.id,
        title: challenge.title,
        callType: challenge.call_type,
        durationMinutes: challenge.duration_minutes,
      },
      participants: publicParticipants(participants),
      dynamicVariables: { user_name: user.user_metadata?.name || 'there' },
    })
  } catch (error) {
    if (
      error instanceof ElevenLabsError ||
      (error instanceof DOMException && error.name === 'TimeoutError')
    ) {
      console.error(error.message)
      return jsonResponse({ error: 'The voice service is unavailable. Try again.' }, 502)
    }
    console.error(error)
    return jsonResponse({ error: 'Could not start the call' }, 500)
  }
})

// Fallback for a missing or late post-call webhook: once ElevenLabs has processed the conversation,
// store it and generate the report through the same path the webhook uses. Running both is safe.
async function syncEndedCall(db: Db, userId: string, callSessionId: string) {
  const conversationId = await loadEndedConversationId(db, userId, callSessionId)
  if (!conversationId) return

  for (let attempt = 0; attempt < SYNC_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, SYNC_POLL_MS))
    let conversation
    try {
      conversation = await getConversation(conversationId)
    } catch (error) {
      // The call never reached ElevenLabs, so there is nothing to store.
      if (error instanceof ElevenLabsError && error.status === 404) return
      throw error
    }
    if (conversation.status === 'done' || conversation.status === 'failed') {
      const savedId = await saveConversation(db, conversation)
      if (savedId) await generateReport(db, savedId)
      return
    }
  }
  console.warn(`Conversation ${conversationId} is still processing; leaving it to the webhook`)
}

// Reuses the challenge's agent while its config is unchanged, patches it after a challenge edit
// and creates it on first use.
async function ensureAgent(db: Db, challenge: ChallengeRow, config: AgentConfig, hash: string) {
  const current = challenge.configs?.elevenlabs
  if (current?.configHash === hash) return current
  if (current) {
    try {
      await updateAgent(current.agentId, config)
      const ref = { agentId: current.agentId, configHash: hash, syncedAt: new Date().toISOString() }
      await saveAgentRef(db, challenge, ref, current.agentId)
      return ref
    } catch (error) {
      if (!(error instanceof ElevenLabsError && error.status === 404)) throw error
    }
  }
  return await createAndStoreAgent(db, challenge, config, hash, current?.agentId ?? null)
}

async function createAndStoreAgent(
  db: Db,
  challenge: ChallengeRow,
  config: AgentConfig,
  hash: string,
  replacedAgentId: string | null,
): Promise<AgentRef> {
  const agentId = await createAgent(config)
  const ref = { agentId, configHash: hash, syncedAt: new Date().toISOString() }
  if (await saveAgentRef(db, challenge, ref, replacedAgentId)) return ref

  // Another request stored an agent first: keep theirs and remove ours.
  await deleteAgent(agentId).catch((error) => console.error(error))
  const winner = await loadAgentRef(db, challenge.id)
  if (!winner) throw new Error(`Agent reference for challenge ${challenge.id} disappeared`)
  return winner
}
