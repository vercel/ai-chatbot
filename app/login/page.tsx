import { auth } from '@/auth'
import LoginForm from '@/components/login-form'
import { Session } from '@/lib/types'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const session = (await auth()) as Session

  if (session) {
    redirect('/')
  }

  return (
    <div className='flex xs:justify-between xl:justify-start xl:gap-[100px] flex-1 items-center justify-center'>
       <video 
      playsInline
      className="w-[450px] hidden xs:block lg:w-[400px] self-stretch object-cover"
      autoPlay
      loop
      muted
      src="https://cdn.dribbble.com/uploads/48226/original/b8bd4e4273cceae2889d9d259b04f732.mp4?1689028949"
    />

      <main className="flex flex-col md:p-8 lg:pr-48">
        <LoginForm />
      </main>
    </div>
  )
}
