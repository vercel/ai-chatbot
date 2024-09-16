'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'
import { IconGitHub, IconSpinner } from '@/components/ui/icons'
import { createClient } from '@/utils/supabase/client'

interface LoginWithGitHubButtonProps extends ButtonProps {
  showGithubIcon?: boolean
  text?: string
}

export function LoginWithGitHubButton({
  text = 'Login with GitHub',
  showGithubIcon = true,
  className,
  ...props
}: LoginWithGitHubButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const supabase = createClient()

  if (process.env.NEXT_PUBLIC_AUTH_GITHUB !== 'true') {
    return null
  }

  return (
    <Button
      variant="outline"
      onClick={async () => {
        setIsLoading(true)
        await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: { redirectTo: `${location.origin}/auth/callback` }
        })
      }}
      disabled={isLoading}
      className={cn(
        className,
        'my-4 flex h-10 w-full flex-row items-center justify-center rounded-md bg-zinc-900 p-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
      )}
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="mr-2 animate-spin" />
      ) : showGithubIcon ? (
        <IconGitHub className="mr-2" />
      ) : null}
      {text}
    </Button>
  )
}
