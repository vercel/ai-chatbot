// import { getUsers } from '@/lib/db';
import { UsersTable } from './user-table'
import { Search } from './search'

import DashboardLayout from './dashboardLayout'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@radix-ui/react-icons'

export default async function Dashboard({
  searchParams
}: {
  searchParams: { q: string; offset: string }
}) {
  const search = searchParams.q ?? ''
  const offset = searchParams.offset ?? 0

  const users = [
    {
      id: 1,
      name: 'John Doe',
      username: 'johndoe',
      email: 'johndoe@example.com'
    },
    {
      id: 2,
      name: 'Jane Smith',
      username: 'janesmith',
      email: 'janesmith@example.com'
    },
    {
      id: 3,
      name: 'Alice Johnson',
      username: 'alicej',
      email: 'alicej@example.com'
    },
    {
      id: 4,
      name: 'Bob Brown',
      username: 'bobbrown',
      email: 'bobbrown@example.com'
    }
  ]

  //   const { users, newOffset } = await getUsers(search, Number(offset));

  return (
    <DashboardLayout>
      <main className="flex flex-1 flex-col p-4 md:p-6">
        <div className="flex items-center mb-8 justify-between">
          <h1 className="font-semibold text-lg md:text-2xl">Users</h1>
          <Button variant="default" className="font-bold flex gap-1">
            <PlusIcon /> Add User
          </Button>
        </div>
        <div className="w-full mb-4">
          <Search value={searchParams.q} />
        </div>
        <UsersTable users={users} offset={0} />
      </main>
    </DashboardLayout>
  )
}
