import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges conditional classes and resolves Tailwind conflicts', () => {
    expect(cn('px-2 text-sm', null, undefined, { glass: true, hidden: false }, 'px-4')).toBe(
      'text-sm glass px-4',
    )
  })
})
