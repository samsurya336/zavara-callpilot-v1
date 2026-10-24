import { useContext } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../store'
import { authRepository } from '../repositories'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth requires AuthProvider')
  return context
}

export function useSignOut() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: () => authRepository.signOut(),
    onSuccess: () => navigate('/sign-in', { replace: true }),
  })
}
