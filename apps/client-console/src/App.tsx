import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Loader2, RotateCcw } from 'lucide-react'
import { AuthFrame, AuthPage, AuthProvider, useAuth, useSignOut } from '@/features/auth'
import { SetupPage, useOrganization } from '@/features/organisation'
import { ConsoleShell } from '@/components/layout/console-shell'
import { Button } from '@/components/ui/button'

function AccessState({ error, retry }: { error?: string; retry?: () => void }) {
  return (
    <AuthFrame title={error ? 'Could not open your workspace' : 'Opening your workspace'}>
      {error ? (
        <div className="mt-6">
          <p role="alert" className="auth-error">
            {error}
          </p>
          <Button className="mt-6 h-11 rounded-full" onClick={retry}>
            <RotateCcw aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : (
        <p role="status" className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          Loading...
        </p>
      )}
    </AuthFrame>
  )
}

function RequireSession() {
  const { session } = useAuth()
  return session ? <Outlet /> : <Navigate to="/sign-in" replace />
}

function WorkspaceRoute({ setup = false }: { setup?: boolean }) {
  const { session } = useAuth()
  const organization = useOrganization()
  const signOut = useSignOut()
  if (organization.isPending) return <AccessState />
  if (organization.isError)
    return (
      <AccessState
        error={organization.error.message}
        retry={() => {
          void organization.refetch()
        }}
      />
    )
  if (!organization.data) return setup ? <SetupPage /> : <Navigate to="/setup" replace />
  if (setup) return <Navigate to="/dashboard" replace />

  const name = session?.user.user_metadata.name
  return (
    <ConsoleShell
      organizationName={organization.data.name}
      userName={
        typeof name === 'string' && name.trim() ? name : (session?.user.email ?? 'Your account')
      }
      onSignOut={() => signOut.mutate()}
      signingOut={signOut.isPending}
      signOutError={signOut.error?.message}
    />
  )
}

function AuthRoutes() {
  const { session, loading, error, retry } = useAuth()
  if (loading) return <AccessState />
  if (error) return <AccessState error={error} retry={retry} />
  return (
    <Routes>
      <Route
        path="/sign-in"
        element={
          session ? <Navigate to="/dashboard" replace /> : <AuthPage key="sign-in" mode="sign-in" />
        }
      />
      <Route
        path="/sign-up"
        element={
          session ? <Navigate to="/dashboard" replace /> : <AuthPage key="sign-up" mode="sign-up" />
        }
      />
      <Route element={<RequireSession />}>
        <Route path="/setup" element={<WorkspaceRoute setup />} />
        <Route path="/dashboard" element={<WorkspaceRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthRoutes />
    </AuthProvider>
  )
}
