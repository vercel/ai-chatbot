'use client'

import { SuperBrainLogo } from '../assets/logo/SuperBrain'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '../ui/button'
import { PinRightIcon } from '@radix-ui/react-icons'
import { useRouter } from 'next/navigation'

export const Navbar = () => {
  const router = useRouter()
  return (
    <header className="border-b-[1px] border-[#ececee]">
      <nav className="stick top-10 z-50 flex justify-between items-center max-w-5xl mx-auto space-x-8 h-[60px]">
        <SuperBrainLogo />
        <Button variant="default" onClick={() => router.push('/login')}>
          <PinRightIcon />
          <span className="hidden ml-2 md:flex font-bold">Sign in</span>
        </Button>
      </nav>
    </header>
  )
}
