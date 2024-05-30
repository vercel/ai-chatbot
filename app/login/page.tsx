import Login from '@/components/login'
import dynamic from 'next/dynamic'


export default async function LoginPage() {
  const DynamicLogin = dynamic(() => import('@/components/login'), {
    ssr: false
  })
  return (
    <div>
      <DynamicLogin />
    </div>
  )
}
