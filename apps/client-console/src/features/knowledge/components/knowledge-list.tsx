import { ChevronRight, FileText } from 'lucide-react'
import type { Knowledge } from '../repositories'
import { fileTypeLabel, formatFileSize, formatKnowledgeDate, knowledgeStatus } from '../services'
import { KnowledgeStatusLabel } from './knowledge-status'

export function KnowledgeList({
  entries,
  onSelect,
}: {
  entries: Knowledge[]
  onSelect: (id: string) => void
}) {
  return (
    <>
      <div className="knowledge-columns section-label" aria-hidden="true">
        <span className="knowledge-columns-name">Name</span>
        <span className="knowledge-size">Size</span>
        <span className="knowledge-date">Added</span>
        <span>Status</span>
      </div>
      <ul className="knowledge-rows" aria-label="Knowledge entries">
        {entries.map((entry) => {
          const size = formatFileSize(entry.fileMeta.size)
          const added = formatKnowledgeDate(entry.createdAt)
          return (
            <li key={entry.id}>
              <button type="button" className="knowledge-row" onClick={() => onSelect(entry.id)}>
                <span className="icon-tile">
                  <FileText size={22} aria-hidden="true" />
                </span>
                <span className="knowledge-row-name">
                  <span className="block truncate text-sm font-semibold">{entry.title}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {entry.fileMeta.name}
                  </span>
                  <span className="knowledge-row-meta mt-1 text-xs text-muted-foreground">
                    {fileTypeLabel(entry.fileType)} · {size} · {added}
                  </span>
                </span>
                <span className="knowledge-size text-sm text-muted-foreground">{size}</span>
                <time
                  dateTime={entry.createdAt}
                  className="knowledge-date text-sm text-muted-foreground"
                >
                  {added}
                </time>
                <KnowledgeStatusLabel status={knowledgeStatus(entry)} />
                <ChevronRight size={18} className="text-muted-foreground" aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
