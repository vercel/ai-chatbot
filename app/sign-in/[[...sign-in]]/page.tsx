import { ClerkLoaded, ClerkLoading, SignIn } from '@clerk/nextjs'

import { cn } from '@/lib/utils'
import { ExternalLink } from '@/components/external-link'
import { buttonVariants } from '@/components/ui/button'
import { IconSpinner } from '@/components/ui/icons'
import { FooterText } from '@/components/footer'

export default function SignInPage() {
  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center">
      <div className="space-y-4">
        <ClerkLoading>
          <div className="flex items-center text-sm text-muted-foreground">
            <IconSpinner className="mr-2 h-5 w-5" /> Loading...
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          <SignIn
            appearance={{
              elements: {
                card: 'shadow rounded-lg border border-border',
                formFieldInput:
                  'flex h-9 w-full rounded-md px-3 py-2 text-sm shadow-sm',
                formButtonPrimary: 'normal-case',
                footerAction: 'text-sm',
                footerActionLink: 'font-medium'
              }
            }}
          />
          <FooterText />
        </ClerkLoaded>
      </div>
    </div>
  )
}
