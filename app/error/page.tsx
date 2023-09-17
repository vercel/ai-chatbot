'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'


export default function ErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  // Custom error messages
  const errorMessages: { [key: string]: string } = {
    AccessDenied: "Email Provider Not Authorised",
  }

  const errorMessage = error ? (errorMessages[error] || "Oops! Something Went Wrong") : "Oops! Something Went Wrong"

  return (
    <div className="flex h-screen flex-col items-center justify-center py-10">
      <h1 className="text-center text-3xl font-bold">{errorMessage}</h1>
      <p className="mt-4 text-center">We apologise for any inconvenience.</p>
      <button
        className="mt-4 cursor-pointer text-blue-500 hover:underline"
      >
        <Link href="/">Return Home</Link>
      </button>
    </div>
  )
}
