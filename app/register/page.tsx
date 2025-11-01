"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authclient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [error, seterror] = useState("");
  const [loading, setloading] = useState(false);

  const handleback = () => {
    router.push("/");
  };

  const handlesubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setloading(true);
    seterror("");
    const { error: signupError } = await authclient.signUp.email({
      email,
      password,
      name: email.split("@")[0],
    });
    if (signupError) {
      seterror(signupError.message || "an error occurred");
      setloading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden lg:block bg-neutral-950">
        <div className="absolute inset-0 bg-[radial-gradient(800px_420px_at_30%_15%,rgba(255,255,255,0.10),transparent),radial-gradient(700px_380px_at_85%_65%,rgba(255,255,255,0.06),transparent)]" />
        <div className="absolute inset-0 p-6 z-20">
          <button onClick={handleback} className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-white/90 backdrop-blur-md cursor-pointer hover:bg-white/20 transition-colors">
            <span>‹</span>
            <span>Back</span>
          </button>
        </div>
        <div className="relative z-10 flex h-full items-end p-12">
          <div className="max-w-xl text-white">
            <h1 className="text-4xl font-semibold leading-tight">Welcome to Chat</h1>
            <p className="mt-4 text-white/80">An open source chatbot template that uses the AI SDK and AI Gateway</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <div className="text-xl font-semibold">Chat</div>
            <h2 className="text-2xl font-bold">Create Account</h2>
            <p className="text-sm text-muted-foreground">Sign up to get started</p>
          </div>

          <form onSubmit={handlesubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setemail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setpassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : "Sign Up"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="underline hover:text-primary">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
