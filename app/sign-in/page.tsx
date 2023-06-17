import { LoginButton } from '@/components/login-button'

export default function SignInPage() {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col items-center justify-center gap-5 py-10">
      <LoginButton />
      <LoginButton provider="google" text="Login with Google" />
    </div>
  )
}
