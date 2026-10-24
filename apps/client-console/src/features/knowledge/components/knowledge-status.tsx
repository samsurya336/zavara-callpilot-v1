import { knowledgeStatusLabels, type KnowledgeStatus } from '../services'

export function KnowledgeStatusLabel({ status }: { status: KnowledgeStatus }) {
  return (
    <span className="knowledge-status" data-progress={status}>
      {knowledgeStatusLabels[status]}
    </span>
  )
}
