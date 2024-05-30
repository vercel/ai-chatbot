'use client'

import { PlusIcon } from '@radix-ui/react-icons'
import PanelLayout from './panelLayout'
import { Search } from '../dashboard/search'
import { UsersTable } from '../dashboard/user-table'
import { users } from '@/lib/user'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { PanelPop } from '@/components/panelPopup'

export default function PanelPage() {
  const router = useRouter()
  const [isCanAccess, setIsCanAccess] = useState(false)
  const [accessValue, setAccessValue] = useState('')
  const ACCESS_KEY = 'hid3sign';
  
  const handleKey = (e: any) => {
    const value = e.target.value
    setAccessValue(value)
  }
  const handleAccess = () => {
    if (accessValue === ACCESS_KEY) {
      setIsCanAccess(true)
    }
  }
  return (
    <>
      {!isCanAccess ? (
        <PanelPop handleKey={handleKey} handleAccess={handleAccess} />
      ) : null}
      <PanelLayout>
        <main className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex items-center mb-8 justify-between">
            <h1 className="font-semibold text-lg md:text-2xl">Organisations</h1>
            <Button
              variant="default"
              className="font-bold flex gap-1"
              onClick={() => router.push('/add-organisation')}
            >
              <PlusIcon /> Add Organisation
            </Button>
          </div>
          <div className="w-full mb-4">
            <Search value={''} />
          </div>
          <UsersTable users={users} offset={0} />
        </main>
      </PanelLayout>
    </>
  )
}
