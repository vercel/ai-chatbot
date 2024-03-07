import LoginForm from '@/components/ui/login-form'

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col p-4">
        <LoginForm />
      </div>
    </main>
  )
}
