import { LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSignOut } from '../hooks'

export function SignOutAction() {
  const signOut = useSignOut()
  return (
    <div>
      {signOut.error && (
        <p role="alert" className="auth-error mb-3">
          {signOut.error.message}
        </p>
      )}
      <Button
        variant="ghost"
        className="h-11 rounded-full"
        disabled={signOut.isPending}
        onClick={() => signOut.mutate()}
      >
        {signOut.isPending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <LogOut aria-hidden="true" />
        )}
        Sign out
      </Button>
    </div>
  )
}
