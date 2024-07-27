import { auth } from '@/auth'
import SignupForm from '@/components/signup-form'
import { Session } from '@/lib/types'
import { redirect } from 'next/navigation'

export default async function SignupPage() {
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
   src="https://cdn.dribbble.com/uploads/48292/original/30fd1f7b63806eff4db0d4276eb1ac45.mp4?1689187515"
 />

   <main className="flex flex-col md:p-8 lg:pr-48">
    <SignupForm />
   </main>
 </div>
  )
}
