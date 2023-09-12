import { useState } from 'react'

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {

  // prevent usage server-side
  if (typeof window === 'undefined') {
    return [initialValue, () => undefined]
  }
  
  // Initialize the state using a function to avoid unnecessary re-render
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : initialValue
  })

  const setValue = (value: T) => {
    // Save state
    setStoredValue(value)
    // Save to localStorage
    window.localStorage.setItem(key, JSON.stringify(value))
  }

  return [storedValue, setValue]
}
