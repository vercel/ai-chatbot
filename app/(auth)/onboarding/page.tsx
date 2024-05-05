import AccountProfile from '@/components/forms/AccountProfile'
import { getCurrentUser } from '@/lib/user.actions'
import { currentUser } from '@clerk/nextjs/server'

export default async function OnboardingPage() {
  const user = await currentUser()
  if (!user) return null

  const userInfo = await getCurrentUser(user.id)
  const userData = {
    id: user.id,
    firstName: userInfo?.firstName ?? '',
    lastName: userInfo?.lastName ?? '',
    companyName: userInfo?.companyName ?? ''
  }
  return (
    <main className="w-full max-w-3xl mx-auto flex flex-col py-20 px-10 justify-start">
      <section className="bg-dark-2 p-10 pt-5 rounded-lg">
        <AccountProfile user={userData} />
      </section>
    </main>
  )
}
