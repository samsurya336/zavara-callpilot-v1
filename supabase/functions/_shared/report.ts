import type { TranscriptTurn } from './transcript.ts'

// Saved in call_session.report. Bump SCORING_GUIDE whenever the rubric or scale changes so reports
// scored under different rules are never compared as equals.
export const REPORT_MODEL = 'gemini-3.8-flash'
export const SCORING_GUIDE = 'callpilot-scoring-v1'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const TIMEOUT_MS = 40_000
const MAX_IMPROVEMENTS = 3
const MAX_STRENGTHS = 2

export type SkillKey =
  | 'discovery'
  | 'communication'
  | 'objectionHandling'
  | 'valueExplanation'
  | 'productAccuracy'
export type EvidenceLevel = 'FULL' | 'PARTIAL' | 'INSUFFICIENT'

const SKILLS: Record<SkillKey, { label: string; guide: string }> = {
  discovery: {
    label: 'Discovery & listening',
    guide: "Asks about the buyer's situation, needs and concerns before pitching, and follows up " +
      'on what they say.',
  },
  communication: {
    label: 'Communication',
    guide: 'Clear, concise and confident. Adapts to the buyer and does not ramble.',
  },
  objectionHandling: {
    label: 'Objection handling',
    guide: 'Acknowledges the objection, finds the real concern, answers it with something ' +
      'relevant and checks that it is resolved.',
  },
  valueExplanation: {
    label: 'Value explanation',
    guide:
      "Connects the offer to the buyer's stated needs and outcomes instead of listing features.",
  },
  productAccuracy: {
    label: 'Product accuracy',
    guide: 'Claims match the product brief. No invented features, prices, discounts or promises.',
  },
}

export interface ReportImprovement {
  title: string
  turnIds: string[]
  // Exact words from one of turnIds, or null when the moment is something the user did not say.
  quote: string | null
  whatToChange: string
  whyItMatters: string
  tryThis: string
  exampleResponse: string
  // A user turn Time Machine can branch from.
  retryTurnId: string | null
}

export interface CallReport {
  version: 1
  scoringGuide: string
  generatedAt: string
  generator: { model: string | null; promptTokens: number | null; outputTokens: number | null }
  evidence: { level: EvidenceLevel; note: string | null }
  summary: string
  outcome: { label: string; explanation: string }
  overall: { score: number | null; label: string; explanation: string }
  skills: { key: SkillKey; label: string; score: number | null; reason: string }[]
  priorityImprovement: ReportImprovement | null
  moreImprovements: ReportImprovement[]
  strengths: { title: string; reason: string; turnId: string }[]
  // Boardroom calls only.
  stakeholders:
    | {
      participantId: string
      name: string
      mainConcern: string
      addressed: string
      stillOpen: string
      turnIds: string[]
    }[]
    | null
  // Only when the challenge has a product brief to check claims against.
  productChecks:
    | {
      claim: string
      turnId: string
      verdict: 'SUPPORTED' | 'CONTRADICTED' | 'UNVERIFIED'
      explanation: string
    }[]
    | null
  nextStep: { kind: 'RETRY_TURN' | 'PRACTISE_SKILL'; label: string; turnId: string | null }
}

export interface ReportParticipant {
  id: string
  name: string
  designation: string
  company: string
  personality?: string | null
  communication_style?: string | null
  hidden_motivation?: string | null
  objections?: string | string[] | null
  decision_authority?: string | null
}

export interface ReportInput {
  challenge: {
    title: string
    description?: string | null
    call_type: string
    difficulty?: string | null
    objective?: string | null
    scenario?: string | null
  }
  participants: ReportParticipant[]
  productContext: string | null
  mode: string
  durationSeconds: number | null
  transcript: TranscriptTurn[]
}

export interface GenerateRequest {
  system: string
  prompt: string
  schema: Record<string, unknown>
}

export interface GenerateResult {
  output: unknown
  model: string
  promptTokens: number | null
  outputTokens: number | null
}

export async function buildReport(
  input: ReportInput,
  generate: (request: GenerateRequest) => Promise<GenerateResult> = generateWithGemini,
): Promise<CallReport> {
  if (!input.transcript.some((turn) => turn.speaker === 'user')) return silentCallReport(input)
  const result = await generate({
    system: SYSTEM_PROMPT,
    prompt: reportPrompt(input),
    schema: reportSchema(input),
  })
  return sanitizeReport(result.output, input, result)
}

const SYSTEM_PROMPT = `You are a sales coach reviewing a recorded practice call. A salesperson \
practised against AI-simulated buyers. Write a short, useful report that helps them improve one \
answer at a time.

Evidence rules:
- Base every statement only on the transcript. Never invent quotes, facts or outcomes.
- Reference real turns by their IDs. A quote must be copied exactly from the referenced turn. If the \
point is something the salesperson did not say (a missed question), set quote to null and explain \
the omission.
- retryTurnId must be the salesperson turn where a different answer would have helped most.
- The buyer notes include hidden motivations and objections. Use them only to judge whether the \
salesperson uncovered or addressed them. Do not reveal hidden motivations word for word.
- Do not guess what the buyer secretly thought or claim a real deal was won or lost. The outcome is \
the simulated result of this practice call only.
- If the call was short or cut off, set evidenceLevel to PARTIAL or INSUFFICIENT, say in evidenceNote \
what cannot be judged, and use a null score for any skill without enough evidence. Never give a \
confident low score just because there was little to judge. With INSUFFICIENT evidence, give at \
most one improvement and only if the transcript clearly supports it.
- Remarks about the practice itself (audio problems, the call cutting out, "can you hear me") are \
not sales behaviour. Do not quote, score or coach them.

Scoring guide (each skill, 1 to 5, or null when there is not enough evidence):
1 = not shown or counterproductive, 2 = weak, 3 = adequate, 4 = strong, 5 = excellent.
${Object.values(SKILLS).map(({ label, guide }) => `- ${label}: ${guide}`).join('\n')}

Priorities:
- priorityImprovement is the single most useful evidence-backed change for this challenge's \
objective, not the most negative point. Give a specific title such as "Ask what the budget covers \
before defending the price", not "Improve discovery".
- moreImprovements has at most two further points. Group repeated mistakes under one point. Use \
fewer points when the evidence supports fewer.
- strengths has at most two specific behaviours worth repeating, each tied to a real turn. Do not \
force strengths that the transcript does not show.
- nextStep is one action: retry the priority improvement's turn, or practise one named skill.

Writing rules:
- Short sentences and familiar words. One or two sentences per field.
- Comment on the response, never on the person. No labels, shaming or empty praise.
- tryThis says what to do; exampleResponse is a short line the salesperson could actually say. Do \
not invent product features, prices, discounts or promises; when product facts are unknown, suggest \
a clarifying question instead.
- Address the salesperson as "you" and buyers by name.
- Never write turn IDs in text fields; the app links the turns you reference.`

function reportPrompt(input: ReportInput) {
  const { challenge, participants } = input
  const names = new Map(participants.map((p) => [p.id, `${p.name} (${p.designation})`]))
  const lines = input.transcript.map((turn) => {
    const speaker = turn.speaker === 'user'
      ? 'SALESPERSON'
      : names.get(turn.participantId ?? '') ?? 'BUYER'
    return `${turn.id} [${clock(turn.timeInCallSecs)}] ${speaker}: ${turn.text}`
  })
  const buyers = participants.map((p) =>
    [
      `- id ${p.id}: ${p.name}, ${p.designation} at ${p.company}`,
      p.decision_authority && `  Decision authority: ${p.decision_authority}`,
      p.personality && `  Personality: ${p.personality}`,
      p.communication_style && `  Communication style: ${p.communication_style}`,
      p.hidden_motivation && `  Hidden motivation: ${p.hidden_motivation}`,
      p.objections?.length &&
      `  Objections: ${Array.isArray(p.objections) ? p.objections.join('; ') : p.objections}`,
    ].filter(Boolean).join('\n')
  )

  return [
    '# Challenge',
    `Title: ${challenge.title}`,
    `Format: ${challenge.call_type === 'BOARDROOM' ? 'Boardroom (several buyers)' : 'One-on-One'}`,
    challenge.difficulty && `Difficulty: ${challenge.difficulty}`,
    challenge.objective && `Salesperson's objective: ${challenge.objective}`,
    challenge.scenario && `Scenario: ${challenge.scenario}`,
    challenge.description && `Description: ${challenge.description}`,
    `Mode: ${input.mode === 'ASSIST' ? 'Assist (coaching allowed)' : 'Battle (no help)'}`,
    `Call length: ${input.durationSeconds == null ? 'unknown' : clock(input.durationSeconds)}`,
    input.productContext &&
    `\n# Product brief (the only verified product facts)\n${input.productContext}`,
    '\n# Buyers (evaluator notes)',
    ...buyers,
    '\n# Transcript',
    ...lines,
  ].filter(Boolean).join('\n')
}

// Turn IDs are enums so the model can only cite turns that exist.
function reportSchema(input: ReportInput) {
  const text = { type: 'string' }
  const turnIds = input.transcript.map((turn) => turn.id)
  const userTurnIds = input.transcript.filter((turn) => turn.speaker === 'user').map((t) => t.id)
  const turnId = { type: 'string', enum: turnIds }
  const turnIdList = { type: 'array', items: turnId, minItems: 1, maxItems: 3 }
  const object = (properties: Record<string, unknown>) => ({
    type: 'object',
    properties,
    required: Object.keys(properties),
  })
  const improvement = object({
    title: text,
    turnIds: turnIdList,
    quote: { type: ['string', 'null'] },
    whatToChange: text,
    whyItMatters: text,
    tryThis: text,
    exampleResponse: text,
    retryTurnId: { anyOf: [{ type: 'string', enum: userTurnIds }, { type: 'null' }] },
  })
  const skillKeys = skillKeysFor(input)

  return object({
    evidenceLevel: { type: 'string', enum: ['FULL', 'PARTIAL', 'INSUFFICIENT'] },
    evidenceNote: { type: ['string', 'null'] },
    summary: { type: 'string', description: 'Two or three short sentences.' },
    outcomeLabel: { type: 'string', description: 'A few words, e.g. "Pilot agreed".' },
    outcomeExplanation: text,
    skills: {
      type: 'array',
      minItems: skillKeys.length,
      maxItems: skillKeys.length,
      items: object({
        key: { type: 'string', enum: skillKeys },
        score: { type: ['integer', 'null'], minimum: 1, maximum: 5 },
        reason: text,
      }),
    },
    priorityImprovement: { anyOf: [improvement, { type: 'null' }] },
    moreImprovements: { type: 'array', items: improvement, maxItems: MAX_IMPROVEMENTS - 1 },
    strengths: {
      type: 'array',
      maxItems: MAX_STRENGTHS,
      items: object({ title: text, reason: text, turnId }),
    },
    ...(input.challenge.call_type === 'BOARDROOM' && {
      stakeholders: {
        type: 'array',
        items: object({
          participantId: { type: 'string', enum: input.participants.map((p) => p.id) },
          mainConcern: text,
          addressed: text,
          stillOpen: text,
          turnIds: turnIdList,
        }),
      },
    }),
    ...(input.productContext && {
      productChecks: {
        type: 'array',
        items: object({
          claim: text,
          turnId: { type: 'string', enum: userTurnIds },
          verdict: { type: 'string', enum: ['SUPPORTED', 'CONTRADICTED', 'UNVERIFIED'] },
          explanation: text,
        }),
      },
    }),
    nextStep: object({
      kind: { type: 'string', enum: ['RETRY_TURN', 'PRACTISE_SKILL'] },
      label: text,
      turnId: { anyOf: [{ type: 'string', enum: userTurnIds }, { type: 'null' }] },
    }),
  })
}

// The schema constrains the model, but its output is still checked against the saved transcript:
// unknown turns are dropped, quotes must really appear in a cited turn and limits are enforced.
export function sanitizeReport(
  raw: unknown,
  input: ReportInput,
  meta: Omit<GenerateResult, 'output'>,
): CallReport {
  const model = (raw ?? {}) as Record<string, any>
  const turns = new Map(input.transcript.map((turn) => [turn.id, turn]))
  const userTurnCount = input.transcript.filter((turn) => turn.speaker === 'user').length
  const knownTurns = (ids: unknown) =>
    [...new Set(Array.isArray(ids) ? ids : [])]
      .filter((id): id is string => typeof id === 'string' && turns.has(id))
      .slice(0, 3)
  const userTurn = (id: unknown) =>
    typeof id === 'string' && turns.get(id)?.speaker === 'user' ? id : null
  const improvement = (item: any): ReportImprovement | null => {
    const turnIds = knownTurns(item?.turnIds)
    if (!text(item?.title) || turnIds.length === 0) return null
    return {
      title: text(item.title),
      turnIds,
      quote: verifiedQuote(item.quote, turnIds.map((id) => turns.get(id)!.text)),
      whatToChange: text(item.whatToChange),
      whyItMatters: text(item.whyItMatters),
      tryThis: text(item.tryThis),
      exampleResponse: text(item.exampleResponse),
      retryTurnId: userTurn(item.retryTurnId),
    }
  }

  const improvements = [model.priorityImprovement, ...list(model.moreImprovements)]
    .map(improvement)
    .filter((item): item is ReportImprovement => item !== null)
    .slice(0, MAX_IMPROVEMENTS)
  const rawSkills = new Map(list(model.skills).map((skill) => [skill?.key, skill]))
  const skills = skillKeysFor(input).map((key) => {
    const skill = rawSkills.get(key)
    const score = Number.isInteger(skill?.score) && skill.score >= 1 && skill.score <= 5
      ? skill.score as number
      : null
    return {
      key,
      label: SKILLS[key].label,
      score,
      reason: text(skill?.reason) || 'Not enough evidence in this call.',
    }
  })
  let level: EvidenceLevel = ['FULL', 'PARTIAL', 'INSUFFICIENT'].includes(model.evidenceLevel)
    ? model.evidenceLevel
    : 'PARTIAL'
  if (level === 'FULL' && userTurnCount < 3) level = 'PARTIAL'
  const participants = new Map(input.participants.map((p) => [p.id, p]))
  const priority = improvements[0] ?? null
  const nextTurn = userTurn(model.nextStep?.turnId) ?? priority?.retryTurnId ?? null

  return {
    version: 1,
    scoringGuide: SCORING_GUIDE,
    generatedAt: new Date().toISOString(),
    generator: {
      model: meta.model,
      promptTokens: meta.promptTokens,
      outputTokens: meta.outputTokens,
    },
    evidence: { level, note: text(model.evidenceNote) || null },
    summary: text(model.summary),
    outcome: { label: text(model.outcomeLabel), explanation: text(model.outcomeExplanation) },
    overall: overallScore(skills),
    skills,
    priorityImprovement: priority,
    moreImprovements: improvements.slice(1),
    strengths: list(model.strengths)
      .filter((item) => text(item?.title) && turns.has(item?.turnId))
      .slice(0, MAX_STRENGTHS)
      .map((item) => ({ title: text(item.title), reason: text(item.reason), turnId: item.turnId })),
    stakeholders: input.challenge.call_type === 'BOARDROOM'
      ? list(model.stakeholders)
        .filter((item) => participants.has(item?.participantId))
        .map((item) => ({
          participantId: item.participantId,
          name: participants.get(item.participantId)!.name,
          mainConcern: text(item.mainConcern),
          addressed: text(item.addressed),
          stillOpen: text(item.stillOpen),
          turnIds: knownTurns(item.turnIds),
        }))
      : null,
    productChecks: input.productContext
      ? list(model.productChecks)
        .filter((item) =>
          userTurn(item?.turnId) &&
          ['SUPPORTED', 'CONTRADICTED', 'UNVERIFIED'].includes(item.verdict)
        )
        .map((item) => ({
          claim: text(item.claim),
          turnId: item.turnId,
          verdict: item.verdict,
          explanation: text(item.explanation),
        }))
      : null,
    // A retry needs an improvement to practise; otherwise the next step is a fresh practice.
    nextStep: model.nextStep?.kind === 'RETRY_TURN' && nextTurn && priority
      ? { kind: 'RETRY_TURN', label: text(model.nextStep.label), turnId: nextTurn }
      : {
        kind: 'PRACTISE_SKILL',
        label: text(model.nextStep?.label) || 'Run this challenge again and focus on the first ' +
            'improvement above.',
        turnId: null,
      },
  }
}

// No user turns means nothing to judge, so no model call and no scores.
function silentCallReport(input: ReportInput): CallReport {
  return {
    version: 1,
    scoringGuide: SCORING_GUIDE,
    generatedAt: new Date().toISOString(),
    generator: { model: null, promptTokens: null, outputTokens: null },
    evidence: {
      level: 'INSUFFICIENT',
      note: 'You did not speak during this call, so there is nothing to score.',
    },
    summary: 'The call ended before you said anything, so there is no conversation to review.',
    outcome: {
      label: 'No conversation',
      explanation: 'The buyer did not hear from you before the call ended.',
    },
    overall: overallScore([]),
    skills: skillKeysFor(input).map((key) => ({
      key,
      label: SKILLS[key].label,
      score: null,
      reason: 'Not enough evidence in this call.',
    })),
    priorityImprovement: null,
    moreImprovements: [],
    strengths: [],
    stakeholders: input.challenge.call_type === 'BOARDROOM' ? [] : null,
    productChecks: input.productContext ? [] : null,
    nextStep: {
      kind: 'PRACTISE_SKILL',
      label: "Start the challenge again and open with one question about the buyer's situation.",
      turnId: null,
    },
  }
}

// A fixed formula keeps scores comparable between attempts: the mean skill score, out of 100.
function overallScore(skills: { score: number | null }[]) {
  const scores = skills.map((skill) => skill.score).filter((score): score is number =>
    score !== null
  )
  if (scores.length < 2) {
    return {
      score: null,
      label: 'Not enough evidence',
      explanation: 'Too few skills could be judged from this call to give a fair overall score.',
    }
  }
  const score = Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 20)
  return {
    score,
    label: score >= 80
      ? 'Strong'
      : score >= 60
      ? 'Solid'
      : score >= 40
      ? 'Developing'
      : 'Needs work',
    explanation: `The average of ${scores.length} skill scores on a 1–5 scale, shown out of 100. ` +
      'This is AI practice feedback, not the chance of a real sale.',
  }
}

async function generateWithGemini(request: GenerateRequest): Promise<GenerateResult> {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

  for (let attempt = 1;; attempt++) {
    const response = await fetch(`${GEMINI_URL}/${REPORT_MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: request.system }] },
        contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: request.schema,
          // Measured on real calls: low thinking returns in 5-13s with the same findings as the
          // default, which took 20-30s and risked the timeout.
          thinkingConfig: { thinkingLevel: 'low' },
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const body = await response.text()
    if (!response.ok) {
      // One retry for rate limits and provider errors; anything else will not succeed on repeat.
      if (attempt === 1 && (response.status === 429 || response.status >= 500)) {
        await new Promise((resolve) => setTimeout(resolve, 2_000))
        continue
      }
      throw new Error(`Gemini ${REPORT_MODEL} failed: ${response.status} ${body.slice(0, 500)}`)
    }

    const result = JSON.parse(body)
    const candidate = result.candidates?.[0]
    const output = (candidate?.content?.parts ?? [])
      .filter((part: { thought?: boolean }) => !part.thought)
      .map((part: { text?: string }) => part.text ?? '')
      .join('')
    if (candidate?.finishReason !== 'STOP' || !output) {
      throw new Error(`Gemini returned no report (finish reason ${candidate?.finishReason})`)
    }
    return {
      output: JSON.parse(output),
      model: result.modelVersion ?? REPORT_MODEL,
      promptTokens: result.usageMetadata?.promptTokenCount ?? null,
      outputTokens: result.usageMetadata?.candidatesTokenCount ?? null,
    }
  }
}

function skillKeysFor(input: ReportInput): SkillKey[] {
  const keys: SkillKey[] = ['discovery', 'communication', 'objectionHandling', 'valueExplanation']
  return input.productContext ? [...keys, 'productAccuracy'] : keys
}

// Case, punctuation and spacing may differ; the words must not.
function verifiedQuote(quote: unknown, turnTexts: string[]) {
  const normalise = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  if (typeof quote !== 'string' || !normalise(quote)) return null
  return turnTexts.some((turnText) => normalise(turnText).includes(normalise(quote)))
    ? quote.trim()
    : null
}

function clock(seconds: number | null) {
  if (seconds == null) return '?:??'
  const whole = Math.max(0, Math.round(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function list(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}
