import type { PropsWithChildren } from 'react'
import { Logo } from '@/components/brand/logo'
import '@/styles/auth.css'

export function AuthFrame({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <div className="auth-page">
      <a href="#auth-content" className="skip-link">
        Skip to content
      </a>
      <header className="auth-brand" aria-label="Sales Copilot">
        <Logo />
      </header>
      <main id="auth-content" tabIndex={-1} className="auth-main">
        <div className="auth-content animate-fade-in">
          <h1 className="auth-title">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  )
}
