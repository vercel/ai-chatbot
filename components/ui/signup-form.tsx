'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { signup } from '@/app/login/actions'
import Link from 'next/link'

export default function LoginForm() {
  const [message, dispatch] = useFormState(signup, undefined)

  return (
    <form
      action={dispatch}
      className="space-y-3 flex flex-col gap-4 items-center"
    >
      <div className="flex-1 rounded-lg border px-6 pb-4 pt-8 dark:bg-zinc-950">
        <h1 className={`mb-3 text-2xl font-bold`}>Sign up for an account!</h1>
        <div className="w-full">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-zinc-400"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border dark:border-zinc-800 py-[9px] px-2 text-sm outline-none dark:bg-zinc-950 placeholder:text-zinc-500 bg-zinc-50"
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label
              className="mb-3 mt-5 block text-xs font-medium text-zinc-400"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border dark:border-zinc-800 py-[9px] px-2 text-sm outline-none dark:bg-zinc-950 placeholder:text-zinc-500 bg-zinc-50"
                id="password"
                type="password"
                name="password"
                placeholder="Enter password"
                required
                minLength={6}
              />
            </div>
          </div>
        </div>
        <LoginButton />
        <div
          className="flex items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {message && (
            <>
              {message.includes('User created!') ? (
                <p className="text-sm text-green-500">{message}</p>
              ) : (
                <p className="text-sm text-red-500">{message}</p>
              )}
            </>
          )}
        </div>
      </div>

      <Link href="/login" className="text-sm text-zinc-400">
        Log in to your account
      </Link>
    </form>
  )
}

function LoginButton() {
  const { pending } = useFormStatus()

  return (
    <button
      className="my-4 w-full dark:bg-zinc-100 bg-zinc-200 p-2 rounded-md text-zinc-900 font-semibold hover:bg-zinc-200 active:bg-zinc-300 text-sm"
      aria-disabled={pending}
    >
      Create account
    </button>
  )
}
