import { authenticate, corsHeaders, jsonResponse, serviceClient } from '../_shared/index.ts'
import {
  type AgentConfig,
  buildAgentConfig,
  callSpeakers,
  configHash,
  publicParticipants,
  speakingParticipants,
} from './agent-config.ts'
import {
  type AgentRef,
  type CallMode,
  type ChallengeRow,
  expireStaleSessions,
  insertCallSession,
  loadAgentRef,
  loadChallenge,
  saveAgentRef,
} from './db.ts'
import {
  createAgent,
  deleteAgent,
  ElevenLabsError,
  getSignedUrl,
  updateAgent,
} from './elevenlabs.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MODES: CallMode[] = ['ASSIST', 'BATTLE']
// After the provider-enforced max duration, an unfinished session stops blocking new calls.
const STALE_GRACE_MINUTES = 5

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
    const mode: CallMode = body.mode ?? challenge.mode ?? 'BATTLE'

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

    const now = new Date()
    await expireStaleSessions(db, user.id, now)
    const expiresAt = new Date(
      now.getTime() + (challenge.duration_minutes + STALE_GRACE_MINUTES) * 60_000,
    )
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
        expiresAt: expiresAt.toISOString(),
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
