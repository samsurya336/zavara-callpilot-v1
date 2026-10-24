// Builds the challenge-generation agent's input and validates its output. No Deno APIs, so the
// Node prompt test in prompts/challenge-generation/ can reuse the same checks.
import { findJsonObject } from '../_shared/agenticorg.ts'

export type CallType = 'ONE_ON_ONE' | 'BOARDROOM'
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

export interface Slot {
  slot: number
  callType: CallType
  angle: string
}

// Every generation produces these three challenges; a retry asks for one slot again.
export const SLOTS: Slot[] = [
  {
    slot: 1,
    callType: 'ONE_ON_ONE',
    angle: "First discovery call: uncover the buyer's real problem and agree a next step.",
  },
  {
    slot: 2,
    callType: 'ONE_ON_ONE',
    angle: 'Later-stage pushback on price, a competitor or the risk of switching.',
  },
  {
    slot: 3,
    callType: 'BOARDROOM',
    angle: 'Executive evaluation: the CEO, CTO and CFO decide whether to start a pilot.',
  },
]

export const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD']
// Keeps the agent prompt bounded; extracted knowledge can be up to 2 MB.
export const MAX_KNOWLEDGE_CHARS = 40_000

const DURATION_RANGE: Record<CallType, [number, number]> = {
  ONE_ON_ONE: [3, 6],
  BOARDROOM: [5, 8],
}
const BOARDROOM_ROLES = [
  /\bCEO\b|chief executive/i,
  /\bCTO\b|chief technology/i,
  /\bCFO\b|chief financial/i,
]

export interface GenerationRequest {
  slots: Slot[]
  difficulty: Difficulty | null
  goal: string | null
  avoidTitles: string[]
  knowledge: { title: string; content: string }
}

export interface GeneratedParticipant {
  name: string
  designation: string
  company: string
  personality: string
  communication_style: string
  decision_authority: string
  hidden_motivation: string
  objections: string[]
}

export interface GeneratedChallenge {
  slot: number
  challenge: {
    title: string
    description: string
    category: string
    difficulty: Difficulty
    call_type: CallType
    duration_minutes: number
    objective: string
    scenario: string
    product_context: string
    tags: string[]
  }
  starterPrompt: string
  participants: GeneratedParticipant[]
  grounding: string[]
}

export type ParsedOutput =
  | { kind: 'not_enough_information' }
  | { kind: 'unreadable' }
  | {
    kind: 'challenges'
    valid: GeneratedChallenge[]
    invalid: { slot: number; reason: string }[]
  }

export function slotFor(slot: number) {
  return SLOTS.find((item) => item.slot === slot)
}

// Cuts at a line break where possible so the agent does not see half a sentence.
export function trimKnowledge(text: string) {
  if (text.length <= MAX_KNOWLEDGE_CHARS) return text
  const cut = text.lastIndexOf('\n', MAX_KNOWLEDGE_CHARS)
  return text.slice(0, cut > MAX_KNOWLEDGE_CHARS / 2 ? cut : MAX_KNOWLEDGE_CHARS)
}

export function buildAgentInput(request: GenerationRequest) {
  return {
    slots: request.slots.map(({ slot, callType, angle }) => ({
      slot,
      call_type: callType === 'BOARDROOM' ? 'boardroom' : 'one_on_one',
      angle,
    })),
    difficulty: request.difficulty,
    user_goal: request.goal,
    avoid_titles: request.avoidTitles,
    knowledge: request.knowledge,
  }
}

const normalise = (text: string) =>
  text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    // Markdown from PDF extraction: the agent may quote "**Pricing:**" as "Pricing:".
    .replace(/[*_`#|>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// An excerpt may be shortened with "..."; every fragment of real words must appear in the source.
export function excerptFound(excerpt: string, source: string) {
  const haystack = normalise(source)
  const fragments = excerpt
    .split(/\.\.\.|…/)
    .map((fragment) => normalise(fragment).replace(/^[\s"',.:;-]+|[\s"',.:;-]+$/g, ''))
    .filter((fragment) => fragment.length >= 6)
  return fragments.length > 0 && fragments.every((fragment) => haystack.includes(fragment))
}

function text(value: unknown, max: number) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

function texts(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => text(item, maxLength))
    .filter((item): item is string => item !== null)
    .slice(0, maxItems)
}

function parseParticipant(value: unknown): GeneratedParticipant | string {
  const person = (value ?? {}) as Record<string, unknown>
  const fields = {
    name: text(person.name, 80),
    designation: text(person.designation, 80),
    company: text(person.company, 120),
    personality: text(person.personality, 200),
    communication_style: text(person.communication_style, 200),
    decision_authority: text(person.decision_authority, 40),
    hidden_motivation: text(person.hidden_motivation, 400),
  }
  const missing = Object.entries(fields).find(([, field]) => field === null)
  if (missing) return `participant is missing ${missing[0]}`
  const objections = texts(person.objections, 5, 300)
  if (objections.length === 0) return 'participant has no objections'
  return { ...(fields as Record<keyof typeof fields, string>), objections }
}

function parseChallenge(
  value: Record<string, unknown>,
  slot: Slot,
  request: GenerationRequest,
  usedTitles: Set<string>,
): GeneratedChallenge | string {
  const challenge = (value.challenge ?? {}) as Record<string, unknown>
  if (challenge.call_type !== slot.callType) return `call_type is not ${slot.callType}`

  const fields = {
    title: text(challenge.title, 80),
    description: text(challenge.description, 300),
    objective: text(challenge.objective, 400),
    scenario: text(challenge.scenario, 1200),
    product_context: text(challenge.product_context, 2000),
  }
  const missing = Object.entries(fields).find(([, field]) => field === null)
  if (missing) return `challenge is missing ${missing[0]}`
  const title = fields.title!
  if (usedTitles.has(title.toLowerCase())) return `title "${title}" is already used`

  const people = Array.isArray(value.participants) ? value.participants : []
  const expected = slot.callType === 'BOARDROOM' ? 3 : 1
  if (people.length !== expected) return `expected ${expected} participants, got ${people.length}`
  const participants: GeneratedParticipant[] = []
  for (const person of people) {
    const parsed = parseParticipant(person)
    if (typeof parsed === 'string') return parsed
    participants.push(parsed)
  }
  if (
    slot.callType === 'BOARDROOM' &&
    !participants.every((person, index) => BOARDROOM_ROLES[index].test(person.designation))
  ) {
    return 'boardroom participants are not CEO, CTO and CFO in order'
  }

  const grounding = texts(value.grounding, 8, 600).filter((excerpt) =>
    excerptFound(excerpt, request.knowledge.content)
  )
  if (grounding.length === 0) return 'no grounding excerpt matches the knowledge'

  const [min, max] = DURATION_RANGE[slot.callType]
  const duration = Number(challenge.duration_minutes)
  const difficulty = request.difficulty ??
    (DIFFICULTIES.includes(challenge.difficulty as Difficulty)
      ? challenge.difficulty as Difficulty
      : 'MEDIUM')

  return {
    slot: slot.slot,
    challenge: {
      title,
      description: fields.description!,
      category: text(challenge.category, 40) ?? 'General',
      difficulty,
      call_type: slot.callType,
      duration_minutes: Number.isFinite(duration)
        ? Math.min(max, Math.max(min, Math.round(duration)))
        : Math.round((min + max) / 2),
      objective: fields.objective!,
      scenario: fields.scenario!,
      product_context: fields.product_context!,
      tags: texts(challenge.tags, 4, 30),
    },
    starterPrompt: text(challenge.starter_prompt, 300) ?? '',
    participants,
    grounding,
  }
}

// Valid challenges can be saved even when others in the same response are not.
export function parseAgentOutput(output: unknown, request: GenerationRequest): ParsedOutput {
  const result = findJsonObject(output, (object) => 'challenges' in object || 'error' in object)
  if (!result) return { kind: 'unreadable' }
  if (result.error === 'NOT_ENOUGH_PRODUCT_INFORMATION') return { kind: 'not_enough_information' }
  if (!Array.isArray(result.challenges)) return { kind: 'unreadable' }

  const usedTitles = new Set(request.avoidTitles.map((title) => title.toLowerCase()))
  const items = result.challenges as Record<string, unknown>[]
  const valid: GeneratedChallenge[] = []
  const invalid: { slot: number; reason: string }[] = []
  for (const slot of request.slots) {
    const item = items.find((candidate) => Number(candidate?.slot) === slot.slot)
    const parsed = item ? parseChallenge(item, slot, request, usedTitles) : 'slot is missing'
    if (typeof parsed === 'string') {
      invalid.push({ slot: slot.slot, reason: parsed })
    } else {
      usedTitles.add(parsed.challenge.title.toLowerCase())
      valid.push(parsed)
    }
  }
  return { kind: 'challenges', valid, invalid }
}
