"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";

export default function AutoLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AutoLoginContent />
    </Suspense>
  );
}

function AutoLoginContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const bubbleUserId = params.get("bubbleUserId");
    if (bubbleUserId) {
      signIn("bubble", { bubbleUserId, redirect: false }).then(() => {
        // Once signed in, navigate to your main chat page or wherever
        router.push("/");
      });
    } else {
      // If no bubbleUserId param, just redirect or show an error
      //router.push('/login');
    }
  }, [params, router]);

  return <div>Auto logging in...</div>;
}