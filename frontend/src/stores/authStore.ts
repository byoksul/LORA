import { create } from 'zustand'
import type { User } from '@/types'

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('lora_token'),
  user: JSON.parse(localStorage.getItem('lora_user') || 'null'),
  setAuth: (token, user) => {
    localStorage.setItem('lora_token', token)
    localStorage.setItem('lora_user', JSON.stringify(user))
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem('lora_token')
    localStorage.removeItem('lora_user')
    set({ token: null, user: null })
  },
  isAuthenticated: () => !!get().token,
}))
