import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authRepository } from './index'

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  invoke: vi.fn(),
  from: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: { signUp: mocks.signUp, signInWithPassword: mocks.signInWithPassword },
    functions: { invoke: mocks.invoke },
    from: mocks.from,
  },
}))

beforeEach(() => vi.resetAllMocks())

describe('authRepository', () => {
  it('signs up with name metadata for automatic profile creation', async () => {
    const result = { user: { id: 'user-id' }, session: { access_token: 'session' } }
    mocks.signUp.mockResolvedValue({ data: result, error: null })
    await expect(
      authRepository.signUp({ name: 'Asha', email: 'asha@example.com', password: 'password' }),
    ).resolves.toEqual(result)
    expect(mocks.signUp).toHaveBeenCalledWith({
      email: 'asha@example.com',
      password: 'password',
      options: { data: { name: 'Asha' } },
    })
  })

  it('propagates password sign-in errors without returning a fake session', async () => {
    const error = new Error('Invalid login credentials')
    mocks.signInWithPassword.mockResolvedValue({ data: null, error })
    await expect(authRepository.signIn('asha@example.com', 'wrong')).rejects.toBe(error)
  })

  it('loads a profile through the typed table query', async () => {
    const profile = { id: 'user-id', name: 'Asha', email: 'asha@example.com' }
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: profile, error: null }),
    }
    mocks.from.mockReturnValue(query)
    await expect(authRepository.getProfile('user-id')).resolves.toEqual(profile)
    expect(mocks.from).toHaveBeenCalledWith('profiles')
    expect(query.eq).toHaveBeenCalledWith('id', 'user-id')
  })

  it('calls the authenticated diagnostic function using GET', async () => {
    mocks.invoke.mockResolvedValue({ data: { users: [] }, error: null })
    await expect(authRepository.listUsersWithOrganizations()).resolves.toEqual([])
    expect(mocks.invoke).toHaveBeenCalledWith('list-users-organizations', { method: 'GET' })
  })
})
