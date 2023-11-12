import { auth } from '@/auth'
import { LoginButton } from '@/components/login-button'
import { redirect } from 'next/navigation'

export default async function SignInPage() {
  const session = await auth()
  const githubEnabled = process.env.AUTH_GITHUB_ENABLED === 'true'
  const googleEnabled = process.env.AUTH_GOOGLE_ENABLED === 'true'
  
  // redirect to home if user is already logged in
  if (session?.user) {
    redirect('/')
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center py-10">
      <LoginButton
        githubEnabled={githubEnabled}
        googleEnabled={googleEnabled}
      />
    </div>
  )
}
