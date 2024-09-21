'use client'

import { useEffect, useState } from 'react'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.toLowerCase() === 'genband') {
      setIsAuthenticated(true)
      localStorage.setItem('isAuthenticated', 'true')
    } else {
      alert('Incorrect password')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-black">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md text-center">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="px-4 py-2 text-lg border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center"
          />
          <button
            type="submit"
            className="px-4 py-2 text-lg text-white bg-black dark:bg-gray-800 rounded-md hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Submit
          </button>
        </form>
      </div>
    )
  }

  return children
}