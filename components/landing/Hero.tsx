'use client'

import { PinRightIcon } from '@radix-ui/react-icons'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'
import { CalBooking } from '../calBooking'

export const Hero = () => {
  const router = useRouter()
  return (
    <div className="hero-section max-w-5xl m-auto space-x-8 my-24">
      <div className="hero-content-action">
        <div className="content max-w-[460px] mb-8">
          <h1 className="mb-8 text-5xl font-bold ">
            SuperBrain® powers your organisation
          </h1>
          <p className="text-[#71717a] text-xl">
            Accelerate decision making speed and quality at work. Network Inc,
            use SuperBrain to power their data-drive business intelligence.
          </p>
        </div>
        <div className="cta-btn-actions flex gap-2">
          <Button variant="secondary" onClick={() => router.push('/login')}>
            <PinRightIcon />
            <span className="hidden ml-2 md:flex font-bold">Sign in</span>
          </Button>
          <CalBooking />
        </div>
      </div>
    </div>
  )
}
