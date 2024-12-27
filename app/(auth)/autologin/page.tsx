"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";

function AutoLoginContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const bubbleUserId = params.get("bubbleUserId");
    if (bubbleUserId) {
      signIn("bubble", { bubbleUserId, redirect: false }).then(() => {
        router.push("/");
      });
    } else {
      // If no bubbleUserId param, just redirect or show an error
      //router.push('/login');
    }
  }, [params, router]);

  return <div>Setting up chat...</div>;
}

export default function AutoLoginPage() {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <AutoLoginContent />
      </Suspense>
    </div>
  );
}
