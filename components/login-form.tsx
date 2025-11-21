"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { GalleryVerticalEnd } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/shared/toast";
import { type SendOTPState, sendOTP } from "@/app/signin/actions";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const isSubmittingRef = useRef(false);
  const hasNavigatedRef = useRef(false);

  const [state, formAction] = useActionState<SendOTPState, FormData>(
    sendOTP,
    {
      status: "idle",
    }
  );

  useEffect(() => {
    if (state.status === "success" && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      toast({
        type: "success",
        description: state.message ?? "OTP code sent to your email",
      });
      if (email) {
        router.push(`/otp?email=${encodeURIComponent(email)}`);
      }
    } else if (state.status === "failed") {
      isSubmittingRef.current = false;
      hasNavigatedRef.current = false;
      toast({
        type: "error",
        description: state.message ?? "Failed to send OTP code",
      });
    } else if (state.status === "invalid_email") {
      isSubmittingRef.current = false;
      hasNavigatedRef.current = false;
      toast({
        type: "error",
        description: state.message ?? "Please enter a valid email address",
      });
    }
  }, [state, router, email]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmittingRef.current || hasNavigatedRef.current) {
      return;
    }

    if (!email.trim()) {
      return;
    }

    isSubmittingRef.current = true;

    // Optimistic navigation - navigate immediately after form submission
    // The toast and error handling will still work via the state effect
    setTimeout(() => {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        toast({
          type: "success",
          description: "OTP code sent to your email",
        });
        router.push(`/otp?email=${encodeURIComponent(email)}`);
      }
    }, 100);

    // Submit the form
    const formData = new FormData(e.currentTarget);
    await formAction(formData);
  };

  const isDisabled = state.status === "in_progress" || isSubmittingRef.current || hasNavigatedRef.current;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Acme Inc.</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to Acme Inc.</h1>
            <div className="text-center text-sm">
              Enter your email to receive a verification code
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="jane.appleseed@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isDisabled}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isDisabled}
            >
              {isDisabled ? "Sending..." : "Continue"}
            </Button>
          </div>
        </div>
      </form>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
