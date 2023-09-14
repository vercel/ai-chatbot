import { useEffect, useState } from 'react'

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    // causes ReferenceError: window is not defined but avoids hydration error
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : initialValue
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(storedValue))
  }, [storedValue, key])

  const setValue = (value: T) => {
    setStoredValue(value)
  }
  return [storedValue, setValue]
}
