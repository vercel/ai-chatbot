'use client';
import { useRouter } from 'next/navigation';
import { useEffect, } from 'react';
import { CivicAuthIframeContainer, useUser } from "@civic/auth-web3/react";

export default function Page() {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <CivicAuthIframeContainer />
      </div>
    </div>
  );
}
