import { beforeEach, describe, expect, it } from 'vitest'
import { useUIStore } from './ui-store'

beforeEach(() => {
  localStorage.clear()
  useUIStore.setState({ theme: 'light', sidebarCollapsed: false, page: 'overview' })
})

describe('UI preferences', () => {
  it('persists theme and sidebar preferences but not navigation', () => {
    useUIStore.getState().setTheme('dark')
    useUIStore.getState().toggleSidebar()
    useUIStore.getState().setPage('clients')

    const saved = JSON.parse(localStorage.getItem('callpilot-ui')!)
    expect(saved.state).toEqual({ theme: 'dark', sidebarCollapsed: true })
    expect(useUIStore.getState().page).toBe('clients')
  })
})
