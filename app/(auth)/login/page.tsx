"use client";

import { Brain, Eye, Sparkles, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useActionState, useEffect, useState } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { type LoginActionState, login } from "../actions";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: "idle",
    }
  );

  const { update: updateSession } = useSession();

  // biome-ignore lint/correctness/useExhaustiveDependencies: router and updateSession are stable refs
  useEffect(() => {
    if (state.status === "failed") {
      toast({
        type: "error",
        description: "Invalid credentials!",
      });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Failed validating your submission!",
      });
    } else if (state.status === "success") {
      setIsSuccessful(true);
      updateSession();
      router.refresh();
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    toast({
      type: "success",
      description: "Password reset link sent to your email!",
    });
  };

  return (
    <div className="relative flex h-dvh w-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Animated Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-left-48 absolute top-1/4 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-3xl" />
        <div
          className="-right-48 absolute bottom-1/4 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-3xl"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-orange-500/10 to-red-500/10 blur-3xl"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-6xl gap-8 px-4">
        {/* Left Side - Branding */}
        <div className="hidden flex-1 flex-col justify-center pr-12 lg:flex">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-75 blur-xl" />
                <div className="relative rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-4">
                  <Brain className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text font-bold text-4xl text-transparent">
                  TiQology Nexus
                </h1>
                <p className="text-muted-foreground">
                  Revolutionary AI Operating System
                </p>
              </div>
            </div>

            <div className="space-y-4 pl-2">
              <h2 className="font-semibold text-2xl">Welcome Back!</h2>
              <p className="text-lg text-muted-foreground">
                Sign in to access your revolutionary AI workspace
              </p>

              <div className="space-y-3 pt-4">
                {[
                  {
                    icon: Brain,
                    text: "Neural Memory that never forgets",
                    color: "from-purple-500 to-pink-500",
                  },
                  {
                    icon: Eye,
                    text: "GPT-4 Vision for image analysis",
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    icon: Users,
                    text: "AI Agent Swarms working in parallel",
                    color: "from-indigo-500 to-purple-500",
                  },
                  {
                    icon: Zap,
                    text: "Real-time collaboration with AI",
                    color: "from-green-500 to-emerald-500",
                  },
                  {
                    icon: Sparkles,
                    text: "Autonomous tasks running 24/7",
                    color: "from-orange-500 to-red-500",
                  },
                ].map((feature, idx) => (
                  <div className="group flex items-center gap-3" key={idx}>
                    <div
                      className={`bg-gradient-to-br p-2 ${feature.color} rounded-lg transition-transform group-hover:scale-110`}
                    >
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <div className="space-y-6 rounded-3xl border border-border/50 bg-background/80 p-8 shadow-2xl backdrop-blur-xl">
              {/* Mobile Logo */}
              <div className="mb-4 flex items-center justify-center gap-2 lg:hidden">
                <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-2">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text font-bold text-2xl text-transparent">
                  TiQology
                </span>
              </div>

              <div className="space-y-2 text-center">
                <h3 className="font-bold text-2xl">Login to TiQology</h3>
                <p className="text-muted-foreground text-sm">
                  Enter your credentials to access Nexus
                </p>
              </div>

              {showForgotPassword ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                    <p className="text-center text-sm">
                      Password reset instructions have been sent to your email!
                    </p>
                  </div>
                  <button
                    className="w-full text-primary text-sm hover:underline"
                    onClick={() => setShowForgotPassword(false)}
                    type="button"
                  >
                    ← Back to login
                  </button>
                </div>
              ) : (
                <>
                  <AuthForm action={handleSubmit} defaultEmail={email}>
                    <div className="mb-4 flex items-center justify-between">
                      <button
                        className="text-primary text-sm hover:underline"
                        onClick={handleForgotPassword}
                        type="button"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <SubmitButton isSuccessful={isSuccessful}>
                      Sign in
                    </SubmitButton>
                  </AuthForm>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        OR
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 p-4 dark:border-blue-800 dark:from-blue-900/20 dark:to-purple-900/20">
                    <p className="mb-2 text-center font-medium text-sm">
                      Demo Credentials:
                    </p>
                    <div className="space-y-1 text-muted-foreground text-sm">
                      <p className="text-center">
                        Use any email and password to try it out!
                      </p>
                      <p className="rounded bg-background/50 px-2 py-1 text-center font-mono text-xs">
                        demo@tiqology.com / demo123
                      </p>
                    </div>
                  </div>

                  <p className="text-center text-muted-foreground text-sm">
                    Don't have an account?{" "}
                    <Link
                      className="font-semibold text-primary hover:underline"
                      href="/register"
                    >
                      Create account Register here
                    </Link>
                  </p>
                </>
              )}
            </div>

            <p className="mt-4 text-center text-muted-foreground text-xs">
              By signing in, you agree to our{" "}
              <Link className="underline hover:text-primary" href="/terms">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link className="underline hover:text-primary" href="/privacy">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
