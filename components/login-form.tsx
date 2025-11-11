"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
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

  const [state, formAction] = useActionState<SendOTPState, FormData>(
    sendOTP,
    {
      status: "idle",
    }
  );

  useEffect(() => {
    if (state.status === "success") {
      toast({
        type: "success",
        description: state.message ?? "OTP code sent to your email",
      });
      // Redirect immediately after success using the stored email
      if (email) {
        router.push(`/otp?email=${encodeURIComponent(email)}`);
      }
    } else if (state.status === "failed") {
      toast({
        type: "error",
        description: state.message ?? "Failed to send OTP code",
      });
    } else if (state.status === "invalid_email") {
      toast({
        type: "error",
        description: state.message ?? "Please enter a valid email address",
      });
    }
  }, [state, router, email]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form action={formAction}>
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
                disabled={state.status === "in_progress"}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={state.status === "in_progress"}
            >
              {state.status === "in_progress" ? "Sending..." : "Continue"}
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
