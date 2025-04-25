'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

export function SignUpForm() {
  const handleGoogleSignIn = async () => {
    toast.info('Google Sign-In needs to be handled via Clerk.');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Sign Up
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          className="w-full"
          onClick={handleGoogleSignIn}
          variant="outline"
        >
          Continue with Google
        </Button>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        By signing up, you agree to our Terms of Service and Privacy Policy
      </CardFooter>
    </Card>
  );
}
