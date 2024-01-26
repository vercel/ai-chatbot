import { auth } from '@/auth'
import { LoginButton } from '@/components/login-button'
import { redirect } from 'next/navigation'
import { IconGitHub, IconGoogle } from '@/components/ui/icons'

export default async function SignInPage() {
  const session = await auth()
  // redirect to home if user is already logged in
  if (session?.user) {
    redirect('/')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] items-center justify-center py-10">
      <LoginButton className='my-2' text="Login with Github" provider="github" icon={<IconGitHub className="mr-2" />}/>
      <LoginButton className='my-2' text="Login with Google" provider="google" icon={<IconGoogle className="mr-2" />} />
    </div>
  )
}
