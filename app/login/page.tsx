import { auth } from '@/auth'
import LoginForm from '@/components/login-form'
import { Session } from '@/lib/types'
import { redirect } from 'next/navigation'
import Login from '@/components/login'

export default async function LoginPage() {
  return (
    <main className="flex flex-col p-4">
      <Login />
    </main>
  )
}
