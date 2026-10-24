export type SkillKey =
  'discovery' | 'communication' | 'objectionHandling' | 'valueExplanation' | 'productAccuracy'
export type EvidenceLevel = 'FULL' | 'PARTIAL' | 'INSUFFICIENT'

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
