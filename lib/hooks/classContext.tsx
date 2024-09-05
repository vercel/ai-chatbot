'use client'

import * as React from 'react'

interface ClassContextType {
  selectedClass: string | null
  setSelectedClass: (className: string) => void
}

const ClassContext = React.createContext<ClassContextType | undefined>(undefined)

export function useClass() {
  const context = React.useContext(ClassContext)
  if (!context) {
    throw new Error('useClass must be used within a ClassProvider')
  }
  return context
}

interface ClassProviderProps {
  children: React.ReactNode
}

export function ClassProvider({ children }: ClassProviderProps) {
  const [selectedClass, setSelectedClass] = React.useState<string | null>(null)

  const handleSetSelectedClass = (className: string) => {
    setSelectedClass(className)
  }

  return (
    <ClassContext.Provider value={{ selectedClass, setSelectedClass: handleSetSelectedClass }}>
      {children}
    </ClassContext.Provider>
  )
}
