'use client'

import { signIn } from '@auth/nextjs/client'

export function Login() {
  return (
    <button
      className="inline-flex w-full items-center justify-center rounded border border-zinc-800 bg-white h-8 px-4 -my-1.5 text-sm leading-6 tracking-tight text-zinc-900 transition-colors ease-in-out hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={() => signIn('github')}
    >
      <span className="font-medium">Login</span>
    </button>
  )
}
