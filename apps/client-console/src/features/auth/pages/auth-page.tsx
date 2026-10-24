import type { FormEvent } from 'react'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthFrame } from '../components/auth-frame'
import { authRepository, type SignUpInput } from '../repositories'

export function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const isSignUp = mode === 'sign-up'
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const mutation = useMutation({
    mutationFn: async (input: SignUpInput) => {
      if (isSignUp && !input.name.trim()) throw new Error('Enter your name.')
      const data = isSignUp
        ? await authRepository.signUp(input)
        : await authRepository.signIn(input.email, input.password)
      if (!data.session)
        throw new Error(
          'No session was created. Try signing in, or check that email confirmation is disabled.',
        )
      return data
    },
    onSuccess: () => navigate('/dashboard', { replace: true }),
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    mutation.mutate({
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email')).trim(),
      password: String(data.get('password')),
    })
  }

  return (
    <AuthFrame title={isSignUp ? 'Create your account' : 'Welcome back'}>
      <p className="auth-description">
        {isSignUp ? 'Your next conversation starts here.' : 'Sign in to your workspace.'}
      </p>
      <form
        onSubmit={submit}
        className="auth-form"
        aria-label={isSignUp ? 'Create account' : 'Sign in'}
      >
        <fieldset disabled={mutation.isPending} className="auth-fields">
          {isSignUp && (
            <div>
              <label htmlFor="name">Your name</label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                required
                maxLength={120}
                className="auth-input"
              />
            </div>
          )}
          <div>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="auth-input"
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                minLength={6}
                className="auth-input auth-password-input"
                aria-describedby={isSignUp ? 'password-hint' : undefined}
              />
              <button
                type="button"
                className="absolute right-1 top-1 grid size-11 place-items-center rounded-full text-muted-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </div>
            {isSignUp && (
              <p id="password-hint" className="mt-2 text-xs text-muted-foreground">
                At least 6 characters
              </p>
            )}
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
              <ArrowRight aria-hidden="true" />
            )}
            {mutation.isPending
              ? isSignUp
                ? 'Creating account...'
                : 'Signing in...'
              : isSignUp
                ? 'Create account'
                : 'Sign in'}
          </Button>
        </fieldset>
      </form>
      <p className="auth-footer">
        {isSignUp ? 'Already have an account?' : 'New to Sales Copilot?'}{' '}
        <Link className="auth-link" to={isSignUp ? '/sign-in' : '/sign-up'}>
          {isSignUp ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </AuthFrame>
  )
}
