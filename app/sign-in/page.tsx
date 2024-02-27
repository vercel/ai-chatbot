import { auth } from '@/auth'
import { LoginButtonSolana } from '@/components/login-button-solana'
import { IconSolana } from '@/components/ui/icons'
import { redirect } from 'next/navigation'

export default async function SignInPage() {
  // const session = await auth()
  // redirect to home if user is already logged in
  // if (session?.user) {
  //   redirect('/')
  // }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center py-10">
      {/* <LoginButtonSolana /> */}
      <IconSolana className="mr-2" />
    </div>
  )
}
