'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { ComponentProps } from 'react'
import { Button } from '@/primitives/Button'
import { Container } from '@/primitives/Container'
import styles from './MarketingHeader.module.css'
import { SuperBrainLogo } from '../assets/logo/SuperBrain'
import { PinRightIcon } from '@radix-ui/react-icons'
import { useRouter } from 'next/navigation'

export function MarketingHeader({
  className,
  ...props
}: ComponentProps<'header'>) {
  const router = useRouter()
  return (
    <header className={clsx(className, styles.header)} {...props}>
      <Container className={styles.container}>
        <Link href="/">
          <SuperBrainLogo fill="white" />
        </Link>
        <form
        //   action={async () => {
        //     "use server";
        //     await signIn();
        //   }}
        >
          <Button icon={<PinRightIcon />} onClick={() => router.push('/login')}>
            Sign in
          </Button>
        </form>
      </Container>
    </header>
  )
}
