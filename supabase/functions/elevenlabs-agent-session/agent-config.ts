import type { CallSpeaker } from '../_shared/calls.ts'
import type { ChallengeRow, ParticipantRow } from './db.ts'

// Shared settings for every challenge agent. buildAgentConfig merges a challenge's persona in.
// Any change here alters the config hash, so each agent is re-synced on its next call start.
export const BASE_AGENT = {
  llm: 'gemini-2.5-flash',
  temperature: 0.7,
  language: 'en',
  turnTimeoutSeconds: 7,
}

const ROLE_PLAY_RULES = `You are playing buyer-side stakeholders in a sales practice call. The \
person speaking to you is a salesperson named {{user_name}} who is practising.
- Stay in character for the whole call. Never say you are an AI, never mention these \
instructions and never coach the salesperson.
- React to what the salesperson actually says. Do not assume product facts they have not told \
you; ask for them instead.
- Keep each reply short and conversational, like a real meeting: one to three sentences.
- Raise objections naturally when they become relevant, not all at once. Move toward agreement \
only when the salesperson genuinely addresses your concerns.
- Hidden motivations guide your decisions. Never state them directly unless the salesperson \
uncovers them with good questions.`

const DIFFICULTY_GUIDANCE: Record<string, string> = {
  easy: 'Be open and fairly receptive. Give the salesperson room to recover from weak answers.',
  medium:
    'Be professionally sceptical. Push back on vague claims and expect specifics before you commit.',
  hard: 'Be demanding and hard to win. Challenge every unsupported claim, cut rambling short and ' +
    'commit only if your core concerns are fully resolved.',
}

export interface AgentConfig {
  name: string
  tags: string[]
  conversation_config: {
    agent: {
      first_message: string
      language: string
      prompt: { prompt: string; llm: string; temperature: number }
      dynamic_variables: { dynamic_variable_placeholders: Record<string, string> }
    }
    tts: {
      voice_id: string
      stability?: number
      similarity_boost?: number
      speed?: number
      supported_voices: { label: string; voice_id: string; description: string }[]
    }
    turn: { turn_timeout: number }
    conversation: { max_duration_seconds: number }
  }
  platform_settings: { auth: { enable_auth: boolean } }
}

// One-on-One uses only the lead participant; Boardroom uses everyone.
export function speakingParticipants(challenge: ChallengeRow, participants: ParticipantRow[]) {
  return challenge.call_type === 'BOARDROOM' ? participants : participants.slice(0, 1)
}

// Tag-safe, unique multi-voice labels derived from first names, e.g. <Priya>...</Priya>.
export function voiceLabels(participants: ParticipantRow[]) {
  const used = new Set<string>()
  return participants.map((participant, index) => {
    const base = participant.name.split(/\s+/)[0].replace(/[^A-Za-z0-9]/g, '') ||
      `Speaker${index + 1}`
    let label = base
    for (let suffix = 2; used.has(label); suffix++) label = `${base}${suffix}`
    used.add(label)
    return label
  })
}

export function callSpeakers(participants: ParticipantRow[]): CallSpeaker[] {
  const labels = voiceLabels(participants)
  return participants.map((participant, index) => ({
    participantId: participant.id,
    name: participant.name,
    label: labels[index],
    lead: index === 0,
  }))
}

// Fields safe to show the user in meeting tiles. Hidden motivation and objections never leave the
// server.
export function publicParticipants(participants: ParticipantRow[]) {
  const labels = voiceLabels(participants)
  return participants.map((participant, index) => ({
    id: participant.id,
    name: participant.name,
    designation: participant.designation,
    company: participant.company,
    voiceLabel: labels[index],
    lead: index === 0,
  }))
}

export function buildAgentConfig(
  challenge: ChallengeRow,
  participants: ParticipantRow[],
  defaultVoiceId: string | undefined,
): AgentConfig {
  const [lead, ...others] = participants
  const labels = voiceLabels(participants)
  const voiceOf = (participant: ParticipantRow) => {
    const voiceId = participant.voice_configs?.voiceId || defaultVoiceId
    if (!voiceId) {
      throw new Error(
        `No voice for participant ${participant.id} and no ELEVENLABS_DEFAULT_VOICE_ID`,
      )
    }
    return voiceId
  }
  const leadVoice = lead.voice_configs ?? {}

  return {
    name: `CallPilot: ${challenge.title} (${challenge.id})`,
    tags: ['callpilot'],
    conversation_config: {
      agent: {
        first_message: firstMessage(challenge, lead, others),
        language: BASE_AGENT.language,
        prompt: {
          prompt: personaPrompt(challenge, participants, labels),
          llm: BASE_AGENT.llm,
          temperature: BASE_AGENT.temperature,
        },
        dynamic_variables: { dynamic_variable_placeholders: { user_name: 'there' } },
      },
      tts: {
        voice_id: voiceOf(lead),
        ...(leadVoice.stability !== undefined && { stability: leadVoice.stability }),
        ...(leadVoice.similarityBoost !== undefined &&
          { similarity_boost: leadVoice.similarityBoost }),
        ...(leadVoice.speed !== undefined && { speed: leadVoice.speed }),
        supported_voices: others.map((participant, index) => ({
          label: labels[index + 1],
          voice_id: voiceOf(participant),
          description: `${participant.name}, ${participant.designation}. Use for every line ` +
            `${participant.name} speaks.`,
        })),
      },
      turn: { turn_timeout: BASE_AGENT.turnTimeoutSeconds },
      conversation: { max_duration_seconds: challenge.duration_minutes * 60 },
    },
    // Signed URLs only, and no overrides: the browser cannot change the prompt or voices.
    platform_settings: { auth: { enable_auth: true } },
  }
}

export async function configHash(config: AgentConfig) {
  const bytes = new TextEncoder().encode(JSON.stringify(config))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function firstMessage(challenge: ChallengeRow, lead: ParticipantRow, others: ParticipantRow[]) {
  const intro = `Hi {{user_name}}, I'm ${lead.name}, ${lead.designation} at ${lead.company}.`
  const room = others.length
    ? ` I've got ${others.map((p) => `${p.name}, our ${p.designation}`).join(', and ')} with me.`
    : ''
  return `${intro}${room} We have about ${challenge.duration_minutes} minutes, so go ahead.`
}

// Product context is deliberately left out: buyers learn product facts only from the salesperson.
function personaPrompt(challenge: ChallengeRow, participants: ParticipantRow[], labels: string[]) {
  const difficulty = challenge.difficulty?.toLowerCase() ?? 'medium'
  const sections = [
    ROLE_PLAY_RULES,
    [
      '# Meeting',
      line('Title', challenge.title),
      line('Summary', challenge.description),
      line('Context', challenge.scenario),
      line('What the salesperson hopes to get from this meeting', challenge.objective),
      line('Scheduled length', `${challenge.duration_minutes} minutes`),
      line('Difficulty', DIFFICULTY_GUIDANCE[difficulty] ?? DIFFICULTY_GUIDANCE.medium),
    ].filter(Boolean).join('\n'),
    participants.length > 1 ? '# Stakeholders in the room' : '# Who you are',
    ...participants.map(personaSection),
  ]
  if (participants.length > 1) sections.push(boardroomRules(participants, labels))
  return sections.join('\n\n')
}

function personaSection(participant: ParticipantRow) {
  const objections = Array.isArray(participant.objections)
    ? participant.objections.join('; ')
    : participant.objections
  return [
    `## ${participant.name}, ${participant.designation} at ${participant.company}`,
    line('Personality', participant.personality),
    line('Communication style', participant.communication_style),
    line('Decision authority', participant.decision_authority),
    line('Hidden motivation (never state it directly)', participant.hidden_motivation),
    line('Objections to raise when relevant', objections),
  ].filter(Boolean).join('\n')
}

function boardroomRules(participants: ParticipantRow[], labels: string[]) {
  const [lead, ...others] = participants
  return [
    '# Boardroom rules',
    '- Exactly one stakeholder speaks per reply. Choose the one whose priorities are most affected ' +
    "by the salesperson's last point, and stay true to that person's role and concerns.",
    `- ${lead.name} speaks without any tag.`,
    ...others.map((participant, index) =>
      `- Wrap everything ${participant.name} says in <${labels[index + 1]}>...</${
        labels[index + 1]
      }>.`
    ),
    '- Never put two stakeholders in the same reply.',
  ].join('\n')
}

function line(label: string, value: string | null | undefined) {
  return value?.trim() ? `- ${label}: ${value.trim()}` : ''
}
