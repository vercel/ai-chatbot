'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { toast } from 'sonner'

export function ForgotPasswordForm() {
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
    } catch (error) {
      console.error('Error signing in with Google:', error)
      toast.error('Failed to sign in with Google. Please try again.')
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-muted-foreground">
          Since you&apos;re using Google to sign in, you don&apos;t need to reset your password here.
          You can manage your Google account password directly through Google.
        </p>
        <Button 
          className="w-full" 
          onClick={handleGoogleSignIn}
          variant="outline"
        >
          Continue with Google
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/auth/login" className="hover:text-brand underline underline-offset-4">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
} 