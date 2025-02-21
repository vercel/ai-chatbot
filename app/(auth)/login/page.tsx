import Link from 'next/link';

import { GoogleAuthForm } from '@/components/auth-google/google-auth-form';

export default function Page() {
  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <GoogleAuthForm />
      </div>
    </div>
  );
}
