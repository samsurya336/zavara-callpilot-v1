import { beforeEach, describe, expect, it, vi } from 'vitest'
import { organizationRepository } from './index'

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }))
vi.mock('@/lib/supabase/client', () => ({ supabase: mocks }))
beforeEach(() => vi.resetAllMocks())

describe('organizationRepository', () => {
  it('uses the atomic creation RPC rather than separate browser inserts', async () => {
    const organization = { id: 'org-id', name: 'Zavara' }
    const single = vi.fn().mockResolvedValue({ data: organization, error: null })
    mocks.rpc.mockReturnValue({ single })
    await expect(organizationRepository.create('Zavara')).resolves.toEqual(organization)
    expect(mocks.rpc).toHaveBeenCalledWith('create_organization', { organization_name: 'Zavara' })
  })

  it('returns organizations and membership roles for the requested user', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ role: 'SUPER_ADMIN', organization: { id: 'org-id', name: 'Zavara' } }],
        error: null,
      }),
    }
    mocks.from.mockReturnValue(query)
    await expect(organizationRepository.listForUser('user-id')).resolves.toEqual([
      { id: 'org-id', name: 'Zavara', role: 'SUPER_ADMIN' },
    ])
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-id')
  })

  it('propagates setup errors', async () => {
    const error = new Error('Sign in first')
    mocks.rpc.mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error }) })
    await expect(organizationRepository.create('Zavara')).rejects.toBe(error)
  })
})
