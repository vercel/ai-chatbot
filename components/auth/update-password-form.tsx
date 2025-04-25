'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function UpdatePasswordForm() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    toast.info('Google Sign-In needs to be handled via Clerk.');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Update Password
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-muted-foreground">
          Since you&apos;re using Google to sign in, you don&apos;t need to
          update your password here. You can manage your Google account password
          directly through Google.
        </p>
        <Button
          className="w-full"
          onClick={handleGoogleSignIn}
          variant="outline"
        >
          Continue with Google
        </Button>
      </CardContent>
    </Card>
  );
}
