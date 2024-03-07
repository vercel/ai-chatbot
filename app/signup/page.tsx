import SignupForm from '@/components/ui/signup-form'

export default function SignupPage() {
  return (
    <main className="flex items-center justify-center">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col p-4">
        <SignupForm />
      </div>
    </main>
  )
}
