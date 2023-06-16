import { FooterText } from '@/components/footer'
import { LoginButton } from '@/components/login-button'

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-screen">
      <div className="space-y-4">
        <LoginButton />
        <FooterText />
      </div>
    </div>
  )
}
