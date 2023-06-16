import { LoginButton } from '@/components/login-button'

export default function SignInPage() {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center py-10">
      <LoginButton />
    </div>
  )
}
