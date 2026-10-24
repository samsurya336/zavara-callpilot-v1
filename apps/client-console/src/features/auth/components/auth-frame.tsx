import type { PropsWithChildren } from 'react'
import { AudioLines } from 'lucide-react'
import '@/styles/auth.css'

export function AuthFrame({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <div className="auth-page">
      <a href="#auth-content" className="skip-link">
        Skip to content
      </a>
      <header className="auth-brand" aria-label="Zavara Callpilot">
        <span className="auth-brand-mark">
          <AudioLines size={23} aria-hidden="true" />
        </span>
        <div>
          <span className="auth-wordmark">callpilot</span>
          <span className="auth-byline">by Zavara</span>
        </div>
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
