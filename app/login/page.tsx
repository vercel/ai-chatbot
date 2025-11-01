"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authclient } from "@/lib/auth-client";
import { guestRegex } from "@/lib/constants";

export default function Login() {
  const router = useRouter();
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [error, seterror] = useState("");
  const [loading, setloading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const session = await authclient.getSession();
      if (session.data?.user?.email && !guestRegex.test(session.data.user.email)) {
        router.push("/");
      }
    };
    checkSession();
  }, [router]);

  const handleback = () => {
    router.push("/");
  };

  const handlesubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setloading(true);
    seterror("");
    const { error: signinError } = await authclient.signIn.email({
      email,
      password,
    });
    if (signinError) {
      seterror(signinError.message || "an error occurred");
      setloading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden bg-neutral-950 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(800px_420px_at_30%_15%,rgba(255,255,255,0.10),transparent),radial-gradient(700px_380px_at_85%_65%,rgba(255,255,255,0.06),transparent)]" />
        <div className="absolute inset-0 z-20 p-6">
          <button
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-white/90 backdrop-blur-md transition-colors hover:bg-white/20"
            onClick={handleback}
          >
            <span>‹</span>
            <span>Back</span>
          </button>
        </div>
        <div className="relative z-10 flex h-full items-end p-12">
          <div className="max-w-xl text-white">
            <h1 className="font-semibold text-4xl leading-tight">
              Welcome to Chat
            </h1>
            <p className="mt-4 text-white/80">
              An open source chatbot template that uses the AI SDK and AI
              Gateway
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <div className="font-semibold text-xl">Chat</div>
            <h2 className="font-bold text-2xl">Welcome Back</h2>
            <p className="text-muted-foreground text-sm">Sign in to continue</p>
          </div>

          <form className="space-y-6" onSubmit={handlesubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                onChange={(e) => setemail(e.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                onChange={(e) => setpassword(e.target.value)}
                placeholder="••••••••"
                required
                type="password"
                value={password}
              />
            </div>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? "Loading..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Don't have an account?{" "}
            </span>
            <Link className="underline hover:text-primary" href="/register">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
