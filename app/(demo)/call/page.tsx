"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CallPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to chat page - the chat page supports voice mode via toggle
    router.replace("/chat");
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground">Redirecting to chat...</p>
    </div>
  );
}
