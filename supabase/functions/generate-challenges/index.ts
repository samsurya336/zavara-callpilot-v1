import { authenticate, jsonResponse, runInBackground, serviceClient } from '../_shared/index.ts'
import { agenticOrgConfigured, AgenticOrgError, runAgent } from '../_shared/agenticorg.ts'
import {
  buildAgentInput,
  DIFFICULTIES,
  type Difficulty,
  type GeneratedChallenge,
  type GenerationRequest,
  parseAgentOutput,
  type ParsedOutput,
  type Slot,
  slotFor,
  SLOTS,
  trimKnowledge,
} from './challenges.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const GOAL_MAX_LENGTH = 240
// Generated challenges per account per day, counting every slot of every run.
const DEFAULT_DAILY_LIMIT = 15
const MAX_ATTEMPTS = 3
// A run still PROCESSING after this was cut off by the runtime and can be retried.
const STALE_AFTER_MS = 5 * 60_000
// Stays under the Edge Runtime wall-clock limit (150 s on the free plan).
const BACKGROUND_BUDGET_MS = 140_000
const MIN_RETRY_BUDGET_MS = 60_000

type Db = ReturnType<typeof serviceClient>

interface GenerationConfig {
  slot: number
  angle: string
  difficulty: Difficulty | null
  goal: string | null
  attempts: number
  [key: string]: unknown
}

interface Job {
  requestId: string
  rows: { id: string; slot: Slot; generation: GenerationConfig }[]
  knowledge: { id: string; title: string; content: string }
  difficulty: Difficulty | null
  goal: string | null
}

class RequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

// One JSON line per step. Filter the function's logs by `event` or `requestId`.
function log(
  level: 'info' | 'warn' | 'error',
  event: string,
  data: Record<string, unknown> = {},
) {
  const line = JSON.stringify({ fn: 'generate-challenges', event, ...data })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

function errorDetail(error: unknown) {
  if (error instanceof AgenticOrgError) return { message: error.message, status: error.status }
  if (error instanceof Error) return { name: error.name, message: error.message }
  if (error && typeof error === 'object') {
    const { code, message, details, hint } = error as Record<string, unknown>
    return { code, message, details, hint }
  }
  return { message: String(error) }
}

// Secret names whose values are missing; values are never logged or returned.
function missingConfig() {
  return ['AGENTICORG_API_KEY', 'AGENTICORG_CHALLENGE_AGENT_ID'].filter(
    (name) => !Deno.env.get(name)?.trim(),
  )
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return jsonResponse({ ok: true })
  // Configuration check without signing in: reports only which secrets are set.
  if (request.method === 'GET') {
    return jsonResponse({
      configured: missingConfig().length === 0,
      missing: missingConfig(),
      baseUrl: Deno.env.get('AGENTICORG_BASE_URL') || 'default',
    })
  }
  if (request.method !== 'POST') return jsonResponse({ error: 'Use POST' }, 405)

  const requestId = crypto.randomUUID().slice(0, 8)
  const user = await authenticate(request)
  if (user instanceof Response) {
    log('warn', 'unauthenticated', { requestId, status: user.status })
    return user
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    log('warn', 'invalid_body', { requestId, userId: user.id })
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  const action = typeof body.retryChallengeId === 'string' ? 'retry' : 'start'
  log('info', 'request', {
    requestId,
    userId: user.id,
    action,
    knowledgeId: body.knowledgeId,
    retryChallengeId: body.retryChallengeId,
    difficulty: body.difficulty,
    hasGoal: Boolean(body.goal),
  })

  const agentId = Deno.env.get('AGENTICORG_CHALLENGE_AGENT_ID')
  if (!agenticOrgConfigured(agentId)) {
    const missing = missingConfig()
    log('error', 'not_configured', { requestId, missing })
    return jsonResponse(
      { error: `Challenge generation is not configured yet (missing ${missing.join(', ')}).` },
      503,
    )
  }

  try {
    const db = serviceClient()
    await failStaleRuns(db, user.id)
    const result = action === 'retry'
      ? await retry(db, user.id, agentId!, body.retryChallengeId, requestId)
      : await start(db, user.id, agentId!, body, requestId)
    log('info', 'accepted', { requestId, ...result })
    return jsonResponse({ status: 'PROCESSING', ...result }, 202)
  } catch (error) {
    if (error instanceof RequestError) {
      log('warn', 'rejected', { requestId, status: error.status, message: error.message })
      return jsonResponse({ error: error.message }, error.status)
    }
    log('error', 'start_failed', { requestId, error: errorDetail(error) })
    return jsonResponse({ error: 'Could not start challenge generation. Try again.' }, 500)
  }
})

async function start(
  db: Db,
  userId: string,
  agentId: string,
  body: Record<string, unknown>,
  requestId: string,
) {
  const { knowledgeId, difficulty = null, goal } = body
  if (typeof knowledgeId !== 'string' || !UUID.test(knowledgeId)) {
    throw new RequestError(400, 'knowledgeId must be a UUID')
  }
  if (difficulty !== null && !DIFFICULTIES.includes(difficulty as Difficulty)) {
    throw new RequestError(400, 'difficulty must be EASY, MEDIUM, HARD or null')
  }
  if (goal !== undefined && goal !== null && typeof goal !== 'string') {
    throw new RequestError(400, 'goal must be a string')
  }
  const trimmedGoal = typeof goal === 'string'
    ? goal.trim().slice(0, GOAL_MAX_LENGTH) || null
    : null
  const knowledge = await loadKnowledge(db, userId, knowledgeId)

  log('info', 'knowledge_loaded', {
    requestId,
    knowledgeId,
    title: knowledge.title,
    contentChars: knowledge.content.length,
  })

  // Repeated clicks join the run already in progress instead of starting another.
  const inFlight = await inFlightIds(db, knowledgeId)
  if (inFlight.length > 0) {
    log('info', 'joined_in_flight', { requestId, challengeIds: inFlight })
    return { challengeIds: inFlight }
  }

  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString()
  const { count, error: countError } = await db
    .from('challenge')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId)
    .eq('source', 'KNOWLEDGE_BASE')
    .gte('created_at', since)
  if (countError) throw countError
  const limit = Number(Deno.env.get('CHALLENGE_GENERATION_DAILY_LIMIT')) || DEFAULT_DAILY_LIMIT
  log('info', 'daily_usage', { requestId, generatedToday: count ?? 0, limit })
  if ((count ?? 0) + SLOTS.length > limit) {
    throw new RequestError(
      429,
      "You have reached today's limit for generated challenges. Try again tomorrow.",
    )
  }

  const generations = SLOTS.map((slot): GenerationConfig => ({
    slot: slot.slot,
    angle: slot.angle,
    difficulty: difficulty as Difficulty | null,
    goal: trimmedGoal,
    knowledgeUpdatedAt: knowledge.updatedAt,
    attempts: 1,
  }))
  const { data: rows, error } = await db
    .from('challenge')
    .insert(SLOTS.map((slot, index) => ({
      created_by: userId,
      source: 'KNOWLEDGE_BASE',
      knowledge_id: knowledgeId,
      title: `Generating ${slot.callType === 'BOARDROOM' ? 'Boardroom' : 'One-on-One'} challenge`,
      difficulty: difficulty ?? 'MEDIUM',
      call_type: slot.callType,
      duration_minutes: slot.callType === 'BOARDROOM' ? 7 : 5,
      objective: '',
      scenario: '',
      is_active: false,
      generation_status: 'PROCESSING',
      configs: { generation: generations[index] },
    })))
    .select('id, configs')
  if (error) {
    // A parallel request inserted its run first; join it.
    if (error.code === '23505') {
      log('info', 'joined_parallel_run', { requestId })
      return { challengeIds: await inFlightIds(db, knowledgeId) }
    }
    throw error
  }

  const job: Job = {
    requestId,
    knowledge,
    difficulty: difficulty as Difficulty | null,
    goal: trimmedGoal,
    rows: rows.map((row) => {
      const generation = (row.configs as { generation: GenerationConfig }).generation
      return { id: row.id, slot: slotFor(generation.slot)!, generation }
    }),
  }
  log('info', 'placeholders_created', {
    requestId,
    rows: job.rows.map((row) => ({ id: row.id, slot: row.slot.slot })),
  })
  runInBackground(generate(db, agentId, job))
  return { challengeIds: job.rows.map((row) => row.id) }
}

async function retry(
  db: Db,
  userId: string,
  agentId: string,
  challengeId: string,
  requestId: string,
) {
  if (!UUID.test(challengeId)) throw new RequestError(400, 'retryChallengeId must be a UUID')
  const { data: row, error } = await db
    .from('challenge')
    .select('id, knowledge_id, generation_status, configs')
    .eq('id', challengeId)
    .eq('created_by', userId)
    .eq('source', 'KNOWLEDGE_BASE')
    .maybeSingle()
  if (error) throw error
  const generation = (row?.configs as { generation?: GenerationConfig } | undefined)?.generation
  const slot = generation && slotFor(generation.slot)
  if (!row || !generation || !slot) throw new RequestError(404, 'Challenge not found')
  if (row.generation_status === 'READY') {
    throw new RequestError(409, 'This challenge is already ready.')
  }
  if (row.generation_status === 'PROCESSING') return { challengeIds: [row.id] }
  if (generation.attempts >= MAX_ATTEMPTS) {
    throw new RequestError(
      429,
      'This challenge failed too many times. Generate a new set instead.',
    )
  }

  const knowledge = await loadKnowledge(db, userId, row.knowledge_id!)
  const next = { ...generation, attempts: generation.attempts + 1 }
  // Only one request can move a FAILED row back to PROCESSING.
  const { data: claimed, error: claimError } = await db
    .from('challenge')
    .update({
      generation_status: 'PROCESSING',
      generation_error: null,
      configs: { generation: next },
    })
    .eq('id', row.id)
    .eq('generation_status', 'FAILED')
    .select('id')
  if (claimError) {
    if (claimError.code === '23505') {
      throw new RequestError(409, 'New challenges are already being generated from this knowledge.')
    }
    throw claimError
  }
  if (claimed.length === 0) return { challengeIds: [row.id] }

  log('info', 'retry_claimed', { requestId, challengeId: row.id, attempt: next.attempts })
  runInBackground(generate(db, agentId, {
    requestId,
    knowledge,
    difficulty: next.difficulty,
    goal: next.goal,
    rows: [{ id: row.id, slot, generation: next }],
  }))
  return { challengeIds: [row.id] }
}

async function loadKnowledge(db: Db, userId: string, knowledgeId: string) {
  const { data, error } = await db
    .from('knowledge')
    .select('id, title, extraction_status, extracted_text, updated_at')
    .eq('id', knowledgeId)
    .eq('created_by', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new RequestError(404, 'Knowledge entry not found')
  if (data.extraction_status !== 'READY' || !data.extracted_text?.trim()) {
    throw new RequestError(409, 'This knowledge entry is not ready yet.')
  }
  return {
    id: data.id,
    title: data.title,
    content: trimKnowledge(data.extracted_text),
    updatedAt: data.updated_at,
  }
}

async function inFlightIds(db: Db, knowledgeId: string) {
  const { data, error } = await db
    .from('challenge')
    .select('id')
    .eq('knowledge_id', knowledgeId)
    .eq('generation_status', 'PROCESSING')
  if (error) throw error
  return data.map((row) => row.id)
}

async function failStaleRuns(db: Db, userId: string) {
  const { error } = await db
    .from('challenge')
    .update({ generation_status: 'FAILED', generation_error: 'Generation took too long.' })
    .eq('created_by', userId)
    .eq('generation_status', 'PROCESSING')
    .lt('updated_at', new Date(Date.now() - STALE_AFTER_MS).toISOString())
  if (error) throw error
}

// One agent call designs every pending slot. Valid challenges are saved; the rest get one more
// call while time allows, then are marked FAILED so the user can retry them.
async function generate(db: Db, agentId: string, job: Job) {
  const { requestId } = job
  const deadline = Date.now() + BACKGROUND_BUDGET_MS
  let pending = job.rows
  let failure = 'The generated challenge was incomplete.'

  try {
    const { data: existing, error } = await db
      .from('challenge')
      .select('title')
      .eq('knowledge_id', job.knowledge.id)
      .eq('generation_status', 'READY')
    if (error) throw error
    const avoidTitles = existing.map((row) => row.title)

    for (let attempt = 0; pending.length > 0 && attempt < 2; attempt++) {
      const remaining = deadline - Date.now()
      if (attempt > 0 && remaining < MIN_RETRY_BUDGET_MS) break
      const request: GenerationRequest = {
        slots: pending.map((row) => row.slot),
        difficulty: job.difficulty,
        goal: job.goal,
        avoidTitles,
        knowledge: { title: job.knowledge.title, content: job.knowledge.content },
      }

      let runId: string | null = null
      let parsed: ParsedOutput
      const startedAt = Date.now()
      log('info', 'agent_call', {
        requestId,
        attempt: attempt + 1,
        slots: request.slots.map((slot) => slot.slot),
        avoidTitles: avoidTitles.length,
        timeoutMs: remaining - 5_000,
      })
      try {
        const run = await runAgent(agentId, buildAgentInput(request), remaining - 5_000)
        runId = run.runId
        log('info', 'agent_response', {
          requestId,
          runId,
          runStatus: run.status,
          ms: Date.now() - startedAt,
          outputType: typeof run.output,
        })
        parsed = parseAgentOutput(run.output, request)
        if (parsed.kind === 'unreadable') {
          const raw = typeof run.output === 'string' ? run.output : JSON.stringify(run.output)
          log('error', 'agent_output_unreadable', { requestId, runId, output: raw?.slice(0, 1500) })
        }
      } catch (error) {
        log('error', 'agent_failed', {
          requestId,
          ms: Date.now() - startedAt,
          error: errorDetail(error),
        })
        failure = agentFailure(error)
        continue
      }

      if (parsed.kind === 'not_enough_information') {
        log('warn', 'not_enough_information', { requestId, runId })
        failure = 'This document does not have enough product information to build a challenge.'
        break
      }
      if (parsed.kind === 'unreadable') continue
      log(parsed.invalid.length > 0 ? 'warn' : 'info', 'agent_output_checked', {
        requestId,
        runId,
        valid: parsed.valid.map((item) => item.slot),
        invalid: parsed.invalid,
      })

      const saved = new Set<string>()
      for (const generated of parsed.valid) {
        const row = pending.find((item) => item.slot.slot === generated.slot)!
        try {
          await saveChallenge(db, row.id, generated, { ...row.generation, runId })
          saved.add(row.id)
          avoidTitles.push(generated.challenge.title)
          log('info', 'challenge_saved', {
            requestId,
            challengeId: row.id,
            slot: generated.slot,
            title: generated.challenge.title,
          })
        } catch (error) {
          log('error', 'save_failed', { requestId, challengeId: row.id, error: errorDetail(error) })
        }
      }
      pending = pending.filter((row) => !saved.has(row.id))
    }
  } catch (error) {
    log('error', 'generation_crashed', { requestId, error: errorDetail(error) })
    throw error
  } finally {
    if (pending.length > 0) {
      log('warn', 'marked_failed', {
        requestId,
        challengeIds: pending.map((row) => row.id),
        reason: failure,
      })
      const { error } = await db
        .from('challenge')
        .update({ generation_status: 'FAILED', generation_error: failure })
        .in('id', pending.map((row) => row.id))
        .eq('generation_status', 'PROCESSING')
      if (error) log('error', 'mark_failed_error', { requestId, error: errorDetail(error) })
    } else {
      log('info', 'generation_done', {
        requestId,
        ms: BACKGROUND_BUDGET_MS - (deadline - Date.now()),
      })
    }
  }
}

async function saveChallenge(
  db: Db,
  challengeId: string,
  generated: GeneratedChallenge,
  generation: GenerationConfig,
) {
  const voices = voicePool()
  // A retry replaces the participants of the earlier attempt.
  const { error: deleteError } = await db
    .from('participant')
    .delete()
    .eq('challenge_id', challengeId)
  if (deleteError) throw deleteError

  const { error: participantError } = await db.from('participant').insert(
    generated.participants.map((person, index) => {
      // Rotate by slot so separate challenges do not all share the same lead voice.
      const voiceId = voices[(generated.slot - 1 + index) % voices.length]
      return {
        ...person,
        challenge_id: challengeId,
        sort_order: index,
        voice_configs: voiceId ? { voiceId } : {},
      }
    }),
  )
  if (participantError) throw participantError

  const { error } = await db
    .from('challenge')
    .update({
      ...generated.challenge,
      is_active: true,
      generation_status: 'READY',
      generation_error: null,
      configs: {
        starter_prompt: generated.starterPrompt,
        generation: { ...generation, grounding: generated.grounding },
      },
    })
    .eq('id', challengeId)
    .eq('generation_status', 'PROCESSING')
  if (error) throw error
}

// ElevenLabs voice IDs as a JSON array or comma-separated list. Empty means every participant
// uses ELEVENLABS_DEFAULT_VOICE_ID.
function voicePool() {
  const value = Deno.env.get('ELEVENLABS_VOICE_POOL')?.trim()
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === 'string' && id.trim() !== '')
    }
  } catch {
    // Fall through to the comma-separated form.
  }
  return value.split(',').map((id) => id.trim()).filter(Boolean)
}

function agentFailure(error: unknown) {
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return 'The challenge generator took too long.'
  }
  if (error instanceof AgenticOrgError && error.status === 429) {
    return 'The challenge generator is busy.'
  }
  return 'The challenge generator is unavailable.'
}
