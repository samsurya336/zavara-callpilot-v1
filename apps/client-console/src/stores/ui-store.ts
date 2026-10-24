import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type Page = 'overview' | 'knowledge' | 'challenges' | 'clients' | 'sessions' | 'settings'

interface UIState {
  theme: Theme
  sidebarCollapsed: boolean
  page: Page
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setPage: (page: Page) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      page: 'overview',
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setPage: (page) => set({ page }),
    }),
    {
      name: 'callpilot-ui',
      partialize: ({ theme, sidebarCollapsed }) => ({ theme, sidebarCollapsed }),
    },
  ),
)
