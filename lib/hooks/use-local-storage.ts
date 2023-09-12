import { useState, useEffect } from 'react'

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    }
    return initialValue
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    }
  }, [storedValue, key])

  const setValue = (value: T) => {
    setStoredValue(value)
  }

  return [storedValue, setValue]
}
