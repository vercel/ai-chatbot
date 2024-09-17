'use client'

import * as React from 'react'

// Define the shape of the context
interface BackgroundContextType {
  selectedBackground: string
  setSelectedBackground: (backgroundUrl: string) => void
}

// Create the context with an undefined initial value
const BackgroundContext = React.createContext<
  BackgroundContextType | undefined
>(undefined)

// Custom hook to use the BackgroundContext
export function useBackground() {
  const context = React.useContext(BackgroundContext)
  if (!context) {
    throw new Error('useBackground must be used within a BackgroundProvider')
  }
  return context
}

// Define the provider's props
interface BackgroundProviderProps {
  children: React.ReactNode
}

// BackgroundProvider component
export function BackgroundProvider({ children }: BackgroundProviderProps) {
  const [selectedBackground, setSelectedBackground] =
    React.useState<string>('0')

  const handleSetSelectedBackground = (id: string) => {
    setSelectedBackground(id)
  }

  return (
    <BackgroundContext.Provider
      value={{
        selectedBackground,
        setSelectedBackground: handleSetSelectedBackground
      }}
    >
      {children}
    </BackgroundContext.Provider>
  )
}
