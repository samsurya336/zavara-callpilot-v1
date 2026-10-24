import { knowledgeFileType } from '../services'
import { DOCUMENTS_BUCKET, supabase } from '@/lib/supabase/client'
import type { Enums, Tables } from '@/lib/supabase/database.types'

export type KnowledgeWorkerProgress = Enums<'knowledge_extraction_status'>

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
  extractionError: string | null
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

type KnowledgeRow = Tables<'knowledge'>

function fileMeta(value: KnowledgeRow['file_meta'], path: string, size: number): KnowledgeFileMeta {
  const meta = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const name = typeof meta.name === 'string' ? meta.name : (path.split('/').pop() ?? 'document.pdf')
  return { name, size: typeof meta.size === 'number' ? meta.size : size }
}

async function signedUrl(path: string) {
  const { data } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(path, 3600)
  return data?.signedUrl ?? ''
}

async function mapRow(row: KnowledgeRow, url?: string): Promise<Knowledge> {
  return {
    id: row.id,
    title: row.title,
    fileUrl: url ?? (await signedUrl(row.file_url)),
    fileType: row.file_type,
    fileMeta: fileMeta(row.file_meta, row.file_url, row.file_size_bytes),
    fileExtraction: row.extracted_text,
    extractionError: row.extraction_error,
    workerProgress: row.extraction_status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const knowledgeRepository = {
  async list(userId: string): Promise<Knowledge[]> {
    const { data: rows, error } = await supabase
      .from('knowledge')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
    if (error) throw error

    return Promise.all(rows.map((row) => mapRow(row)))
  },

  async create({ title, file, createdBy }: CreateKnowledgeInput) {
    const knowledgeId = crypto.randomUUID()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_') || 'document.pdf'
    const path = `knowledge/${createdBy}/${knowledgeId}/${safeName}`
    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        contentType: 'application/pdf',
        upsert: false,
      })
    if (uploadError) throw uploadError

    const { data: row, error: insertError } = await supabase
      .from('knowledge')
      .insert({
        id: knowledgeId,
        created_by: createdBy,
        title,
        file_url: path,
        file_type: knowledgeFileType(file.name) ?? 'application/pdf',
        file_size_bytes: file.size,
        file_meta: { name: file.name, size: file.size },
        extraction_status: 'PROCESSING',
      })
      .select('*')
      .single()

    if (insertError || !row) {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([path])
      throw insertError ?? new Error('Could not create the knowledge entry.')
    }

    // The function owns status updates. The page observes PROCESSING and polls
    // until the function stores READY or FAILED.
    void supabase.functions
      .invoke('extract-knowledge', { body: { knowledgeId } })
      .catch(() => undefined)
    return mapRow(row)
  },

  async retry(id: string) {
    const { error } = await supabase.functions.invoke('extract-knowledge', {
      body: { knowledgeId: id },
    })
    if (error) throw error
  },

  async remove(id: string) {
    const { data: row, error: lookupError } = await supabase
      .from('knowledge')
      .select('file_url')
      .eq('id', id)
      .single()
    if (lookupError) throw lookupError

    const { error: deleteError } = await supabase.from('knowledge').delete().eq('id', id)
    if (deleteError) throw deleteError
    const { error: storageError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([row.file_url])
    if (storageError) throw storageError
  },
}
