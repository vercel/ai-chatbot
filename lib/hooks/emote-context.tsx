'use client'

import * as React from 'react'

// Define the shape of the context
interface EmoteContextType {
  selectedEmote: string
  setSelectedEmote: (emoteEmoji: string) => void
}

// Create the context with an undefined initial value
const EmoteContext = React.createContext<EmoteContextType | undefined>(
  undefined
)

// Custom hook to use the EmoteContext
export function useEmote() {
  const context = React.useContext(EmoteContext)
  if (!context) {
    throw new Error('useEmote must be used within a EmoteProvider')
  }
  return context
}

// Define the provider's props
interface EmoteProviderProps {
  children: React.ReactNode
}

// EmoteProvider component
export function EmoteProvider({ children }: EmoteProviderProps) {
  const [selectedEmote, setSelectedEmote] = React.useState<string>('')

  const handleSetSelectedEmote = (id: string) => {
    setSelectedEmote(id)
  }

  return (
    <EmoteContext.Provider
      value={{
        selectedEmote,
        setSelectedEmote: handleSetSelectedEmote
      }}
    >
      {children}
    </EmoteContext.Provider>
  )
}
