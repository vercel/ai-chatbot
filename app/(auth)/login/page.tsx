"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { LoaderIcon } from "@/components/icons";
import { type LoginActionState, login } from "../actions";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: "idle",
    }
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: router is a stable ref
  useEffect(() => {
    if (state.status === "failed") {
      toast({
        type: "error",
        description: "Invalid credentials!",
      });
      setIsSuccessful(false);
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Failed validating your submission!",
      });
      setIsSuccessful(false);
    } else if (state.status === "success") {
      setIsSuccessful(true);
      // Redirect to chat page after successful login
      setTimeout(() => {
        router.push("/");
      }, 500);
    }
  }, [state.status, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  const handleTryAsGuest = async () => {
    if (isCreatingGuest) {
      return;
    }

    setIsCreatingGuest(true);

    try {
      // Use window.location.href to navigate to the guest endpoint
      // This allows the server-side route handler to set cookies and redirect properly
      // The route handler will create the guest session and redirect to home
      window.location.href = "/api/auth/guest?redirectUrl=/";
    } catch (error) {
      console.error("Error creating guest session:", error);
      toast({
        type: "error",
        description: "Failed to start guest session. Please try again.",
      });
      setIsCreatingGuest(false);
    }
  };

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">Sign In</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-center text-gray-600 text-sm dark:text-zinc-400">
              {"Don't have an account? "}
              <Link
                className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
                href="/register"
              >
                Sign up
              </Link>
              {" for free."}
            </p>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-gray-500 dark:text-zinc-400">
                  Or
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleTryAsGuest}
              disabled={isCreatingGuest || isSuccessful}
              className="w-full"
            >
              {isCreatingGuest ? (
                <>
                  <span className="mr-2 animate-spin">
                    <LoaderIcon />
                  </span>
                  Creating guest session...
                </>
              ) : (
                "Try as guest"
              )}
            </Button>
          </div>
        </AuthForm>
      </div>
    </div>
  );
}
