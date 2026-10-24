import type { ChallengeRow, ParticipantRow } from './db.ts'

export function challengeFixture(overrides: Partial<ChallengeRow> = {}): ChallengeRow {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'The Price Negotiator',
    description: 'Convince a finance head to consider your SaaS',
    category: 'Objection Handling',
    difficulty: 'Medium',
    call_type: 'ONE_ON_ONE',
    duration_minutes: 4,
    objective: 'Secure approval for a pilot',
    scenario: 'Pricing evaluation meeting',
    is_active: true,
    source: 'INTERNAL',
    mode: 'BATTLE',
    configs: null,
    created_by: null,
    ...overrides,
  }
}

export function participantFixture(overrides: Partial<ParticipantRow> = {}): ParticipantRow {
  return {
    id: '00000000-0000-4000-8000-000000000101',
    name: 'Priya Shah',
    designation: 'CFO',
    company: 'Northwind Logistics',
    personality: 'Sceptical',
    communication_style: 'Direct',
    hidden_motivation: 'Needs to cut tooling spend by 15% this year',
    objections: ['Too expensive', 'We already use spreadsheets'],
    decision_authority: 'Decision-maker',
    voice_configs: { voiceId: 'voice-priya', stability: 0.6 },
    ...overrides,
  }
}

export const boardroomParticipants: ParticipantRow[] = [
  participantFixture({ name: 'Arjun Mehta', designation: 'CEO', voice_configs: null }),
  participantFixture({
    id: '00000000-0000-4000-8000-000000000102',
    name: 'Arjun Rao',
    designation: 'CTO',
    hidden_motivation: 'Wants to avoid another integration project',
    voice_configs: { voiceId: 'voice-cto' },
  }),
  participantFixture({ id: '00000000-0000-4000-8000-000000000103' }),
]
