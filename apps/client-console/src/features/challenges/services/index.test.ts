import { describe, expect, it } from 'vitest'
import { GENERATION_STALE_MS, generationState } from '.'

describe('generationState', () => {
  const now = Date.parse('2026-10-24T12:00:00Z')
  const at = (msAgo: number) => new Date(now - msAgo).toISOString()

  it('maps saved statuses', () => {
    expect(generationState({ generationStatus: 'READY', updatedAt: at(0) }, now)).toBe('ready')
    expect(generationState({ generationStatus: 'FAILED', updatedAt: at(0) }, now)).toBe('failed')
    expect(generationState({ generationStatus: 'PROCESSING', updatedAt: at(1000) }, now)).toBe(
      'generating',
    )
  })

  it('treats a run that never finished as failed so it can be retried', () => {
    expect(
      generationState(
        { generationStatus: 'PROCESSING', updatedAt: at(GENERATION_STALE_MS + 1) },
        now,
      ),
    ).toBe('failed')
  })
})
