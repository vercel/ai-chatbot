'use client'

import * as React from 'react'

// Define the shape of the context
interface SubtitlesContextType {
  subtitlesState: boolean
  setSubtitlesState: (state: boolean) => void
}

// Create the context with an undefined initial value
const SubtitlesContext = React.createContext<SubtitlesContextType | undefined>(
  undefined
)

// Custom hook to use the SubtitlesContext
export function useSubtitles() {
  const context = React.useContext(SubtitlesContext)
  if (!context) {
    throw new Error('useSubtitles must be used within a SubtitlesProvider')
  }
  return context
}

// Define the provider's props
interface SubtitlesProviderProps {
  children: React.ReactNode
}

// SubtitlesProvider component
export function SubtitlesProvider({ children }: SubtitlesProviderProps) {
  const [subtitlesState, setSubtitlesState] = React.useState<boolean>(true)

  return (
    <SubtitlesContext.Provider
      value={{
        subtitlesState,
        setSubtitlesState
      }}
    >
      {children}
    </SubtitlesContext.Provider>
  )
}
