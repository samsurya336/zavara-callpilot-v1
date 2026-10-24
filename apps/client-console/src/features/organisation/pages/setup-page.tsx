import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthFrame, SignOutAction, useAuth } from '@/features/auth'
import { organizationRepository } from '../repositories'
import { organizationKey } from '../hooks'

export function SetupPage() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: async (name: string) => {
      if (!name.trim()) throw new Error('Enter your organisation name.')
      return organizationRepository.create(name.trim())
    },
    onSuccess: (organization) => {
      queryClient.setQueryData(organizationKey(session!.user.id), {
        ...organization,
        role: 'SUPER_ADMIN',
      })
      navigate('/dashboard', { replace: true })
    },
  })
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    mutation.mutate(String(new FormData(event.currentTarget).get('organization')))
  }

  return (
    <AuthFrame title="Set up your organisation">
      <p className="auth-description">One workspace for your team.</p>
      <form className="auth-form" onSubmit={submit} aria-label="Organisation setup">
        <fieldset className="auth-fields" disabled={mutation.isPending}>
          <div>
            <label htmlFor="organization">Organisation name</label>
            <input
              id="organization"
              name="organization"
              autoComplete="organization"
              required
              maxLength={160}
              className="auth-input"
            />
          </div>
          {mutation.error && (
            <p role="alert" className="auth-error">
              {mutation.error.message}
            </p>
          )}
          <Button type="submit" className="h-12 w-full rounded-full shadow-cta">
            {mutation.isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Building2 aria-hidden="true" />
            )}
            {mutation.isPending ? 'Creating workspace...' : 'Create workspace'}
            {!mutation.isPending && <ArrowRight aria-hidden="true" />}
          </Button>
        </fieldset>
      </form>
      <div className="auth-footer border-t border-border pt-5">
        <SignOutAction />
      </div>
    </AuthFrame>
  )
}
