'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { PatientForm } from './components/form'

export default function PatientPage() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const authStatus = searchParams.get('auth')
    if (authStatus === 'success') {
      console.log('Device connected successfully')
      // Handle successful connection (e.g., show a success message, update user state)
    } else if (authStatus === 'failure') {
      console.log('Device connection failed')
      // Handle failed connection (e.g., show an error message)
    }
  }, [searchParams])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Patient Health Device Connection</h1>
      <PatientForm />
    </div>
  )
}
