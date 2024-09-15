import { OrganizationList } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await auth()

  const org = session.orgSlug

  if (!org) return <OrganizationList hidePersonal={true} />

  redirect(`/${org}`)
}
