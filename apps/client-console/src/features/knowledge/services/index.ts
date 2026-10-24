import type { Knowledge } from '../repositories'

export type KnowledgeStatus = 'processing' | 'failed' | 'ready'

export const KNOWLEDGE_MAX_FILE_SIZE = 10 * 1024 * 1024
export const KNOWLEDGE_TITLE_MAX_LENGTH = 160
export const KNOWLEDGE_FILE_ACCEPT = '.pdf,.txt,application/pdf,text/plain'

export const knowledgeStatusLabels: Record<KnowledgeStatus, string> = {
  ready: 'Ready',
  processing: 'Processing',
  failed: 'Failed',
}

const fileTypes: Partial<Record<string, { mime: string; label: string }>> = {
  pdf: { mime: 'application/pdf', label: 'PDF' },
  txt: { mime: 'text/plain', label: 'TXT' },
}

export function knowledgeFileType(fileName: string) {
  return fileTypes[fileName.split('.').pop()?.toLowerCase() ?? '']?.mime
}

export function fileTypeLabel(fileType: string) {
  return Object.values(fileTypes).find((type) => type?.mime === fileType)?.label ?? 'File'
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${Number((bytes / 1024 / 1024).toFixed(1))} MB`
}

export function validateKnowledgeFile(file: File) {
  const type = knowledgeFileType(file.name)
  const reportedType = file.type.split(';')[0]
  if (!type || (reportedType && reportedType !== type)) return 'Choose a PDF or TXT file.'
  if (file.size === 0) return 'This file is empty.'
  if (file.size > KNOWLEDGE_MAX_FILE_SIZE) {
    return `Choose a file up to ${formatFileSize(KNOWLEDGE_MAX_FILE_SIZE)}.`
  }
  return null
}

export function knowledgeStatus({
  workerProgress,
}: Pick<Knowledge, 'workerProgress'>): KnowledgeStatus {
  if (workerProgress === 'PROCESSING') return 'processing'
  if (workerProgress === 'FAILED') return 'failed'
  return 'ready'
}

export function titleFromFileName(fileName: string) {
  const title = fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_\s]+/g, ' ')
    .trim()
  return (title.charAt(0).toUpperCase() + title.slice(1)).slice(0, KNOWLEDGE_TITLE_MAX_LENGTH)
}

const dateFormat = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const dateTimeFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' })

export const formatKnowledgeDate = (value: string) => dateFormat.format(new Date(value))
export const formatKnowledgeDateTime = (value: string) => dateTimeFormat.format(new Date(value))
