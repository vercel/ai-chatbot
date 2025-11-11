"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { GalleryVerticalEnd } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "@/components/shared/toast";
import { type VerifyOTPState, verifyOTP } from "@/app/otp/actions";
import { sendOTP } from "@/app/signin/actions";

export function OTPForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otpValue, setOtpValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState<VerifyOTPState, FormData>(
    verifyOTP,
    {
      status: "idle",
    }
  );

  useEffect(() => {
    if (state.status === "failed") {
      toast({
        type: "error",
        description: state.message ?? "Invalid OTP code",
      });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: state.message ?? "Please enter a valid 6-digit code",
      });
    }
  }, [state]);

  const handleResend = () => {
    if (!email) {
      toast({
        type: "error",
        description: "Email address is required",
      });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", email);
      const result = await sendOTP({ status: "idle" }, formData);
      if (result.status === "success") {
        toast({
          type: "success",
          description: "OTP code resent to your email",
        });
      } else if (result.status === "failed") {
        toast({
          type: "error",
          description: "Failed to resend OTP code",
        });
      }
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form action={formAction}>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="token" value={otpValue} />
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Acme Inc.</span>
            </a>
            <h1 className="text-xl font-bold">Enter verification code</h1>
            <FieldDescription>
              We sent a 6-digit code to {email || "your email address"}
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="otp" className="sr-only">
              Verification code
            </FieldLabel>
            <InputOTP
              maxLength={6}
              id="otp"
              value={otpValue}
              onChange={setOtpValue}
              required
              containerClassName="gap-4"
              disabled={state.status === "in_progress"}
            >
              <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <FieldDescription className="text-center">
              Didn&apos;t receive the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                className="underline underline-offset-4"
                disabled={isPending}
              >
                {isPending ? "Sending..." : "Resend"}
              </button>
            </FieldDescription>
          </Field>
          <Field>
            <Button
              type="submit"
              disabled={otpValue.length !== 6 || state.status === "in_progress"}
            >
              {state.status === "in_progress" ? "Verifying..." : "Verify"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
