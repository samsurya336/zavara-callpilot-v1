import { describe, expect, it } from 'vitest'
import {
  KNOWLEDGE_MAX_FILE_SIZE,
  fileTypeLabel,
  formatFileSize,
  knowledgeStatus,
  titleFromFileName,
  validateKnowledgeFile,
} from './index'

const fileOfSize = (name: string, size: number, type = '') => {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('knowledge services', () => {
  it('accepts one PDF or TXT file within the size limit', () => {
    expect(validateKnowledgeFile(fileOfSize('guide.pdf', 2048, 'application/pdf'))).toBeNull()
    expect(validateKnowledgeFile(fileOfSize('NOTES.TXT', 2048, 'text/plain'))).toBeNull()
    expect(validateKnowledgeFile(fileOfSize('notes.txt', 2048))).toBeNull()
  })

  it('rejects unsupported, mislabelled, empty and oversized files', () => {
    expect(validateKnowledgeFile(fileOfSize('deck.pptx', 2048))).toBe('Choose a PDF or TXT file.')
    expect(validateKnowledgeFile(fileOfSize('guide.pdf', 2048, 'image/png'))).toBe(
      'Choose a PDF or TXT file.',
    )
    expect(validateKnowledgeFile(fileOfSize('guide.pdf', 0, 'application/pdf'))).toBe(
      'This file is empty.',
    )
    expect(
      validateKnowledgeFile(
        fileOfSize('guide.pdf', KNOWLEDGE_MAX_FILE_SIZE + 1, 'application/pdf'),
      ),
    ).toBe('Choose a file up to 10 MB.')
  })

  it('treats an entry without worker progress as ready', () => {
    expect(knowledgeStatus({ workerProgress: 'PROCESSING' })).toBe('processing')
    expect(knowledgeStatus({ workerProgress: 'FAILED' })).toBe('failed')
    expect(knowledgeStatus({ workerProgress: null })).toBe('ready')
  })

  it('formats file details for display', () => {
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(12_800)).toBe('13 KB')
    expect(formatFileSize(2.4 * 1024 * 1024)).toBe('2.4 MB')
    expect(formatFileSize(KNOWLEDGE_MAX_FILE_SIZE)).toBe('10 MB')
    expect(fileTypeLabel('application/pdf')).toBe('PDF')
    expect(fileTypeLabel('text/plain')).toBe('TXT')
    expect(fileTypeLabel('application/octet-stream')).toBe('File')
    expect(titleFromFileName('pricing-guide_2026.pdf')).toBe('Pricing guide 2026')
  })
})
