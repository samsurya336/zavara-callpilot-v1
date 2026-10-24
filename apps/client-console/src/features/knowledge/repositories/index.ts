import { knowledgeFileType } from '../services'

export type KnowledgeWorkerProgress = 'PROCESSING' | 'FAILED'

export interface KnowledgeFileMeta {
  name: string
  size: number
}

export interface Knowledge {
  id: string
  title: string
  fileUrl: string
  fileType: string
  fileMeta: KnowledgeFileMeta
  fileExtraction: string | null
  workerProgress: KnowledgeWorkerProgress | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CreateKnowledgeInput {
  title: string
  file: File
  createdBy: string
}

// Session-only stand-in until the knowledge table, private storage and extraction worker exist.
let entries: Knowledge[] = []

function findEntry(id: string) {
  const entry = entries.find((item) => item.id === id)
  if (!entry) throw new Error('This knowledge entry no longer exists.')
  return entry
}

export const knowledgeRepository = {
  async list(userId: string) {
    return entries.filter((entry) => entry.createdBy === userId)
  },

  async create({ title, file, createdBy }: CreateKnowledgeInput) {
    const now = new Date().toISOString()
    const entry: Knowledge = {
      id: crypto.randomUUID(),
      title,
      fileUrl: URL.createObjectURL(file),
      fileType: knowledgeFileType(file.name) ?? file.type,
      fileMeta: { name: file.name, size: file.size },
      fileExtraction: null,
      workerProgress: 'PROCESSING',
      createdBy,
      createdAt: now,
      updatedAt: now,
    }
    entries = [entry, ...entries]
    return entry
  },

  async retry(id: string) {
    findEntry(id)
    entries = entries.map((entry) =>
      entry.id === id
        ? { ...entry, workerProgress: 'PROCESSING', updatedAt: new Date().toISOString() }
        : entry,
    )
  },

  async remove(id: string) {
    URL.revokeObjectURL(findEntry(id).fileUrl)
    entries = entries.filter((entry) => entry.id !== id)
  },
}
