import { auth } from '@/auth'
import { LoginButtonSolana } from '@/components/login-button-solana'
import { Header } from '@/components/header'
import { redirect } from 'next/navigation'

export default async function SignInPage() {
  // const session = await auth()
  // redirect to home if user is already logged in
  // if (session?.user) {
  //   redirect('/')
  // }

  return (
    <div className="">
      <Header />
      <LoginButtonSolana />
    </div>
  )
}
