"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Demo mode - just redirect after brief delay
    setTimeout(() => {
      router.push("/avatar");
    }, 800);
  };

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">Sign In to Glen AI</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Enter your email to access the platform
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 sm:px-16">
          <div className="flex flex-col gap-2">
            <Label
              className="font-normal text-zinc-600 dark:text-zinc-400"
              htmlFor="email"
            >
              Email Address
            </Label>

            <Input
              autoComplete="email"
              autoFocus
              className="bg-muted text-md md:text-sm"
              id="email"
              name="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              type="email"
              value={email}
            />
          </div>

          <Button
            className="mt-4 w-full"
            disabled={isLoading || !email}
            type="submit"
          >
            {isLoading ? "Signing in..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
