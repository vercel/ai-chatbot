import { create } from 'zustand'

interface UseChatStore {
  defaultMessage: string
  setDefaultMessage: (message: string) => void
}

export const useChatStore = create<UseChatStore>()(set => ({
  defaultMessage: '',
  setDefaultMessage: message => set({ defaultMessage: message })
}))
