import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { user } from "@/lib/db/schema";
import { OnboardingForm } from "@/components/auth/onboarding-form";

async function OnboardingContent() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/signin");
  }

  // Check if user already completed onboarding
  const client = postgres(process.env.POSTGRES_URL!);
  const db = drizzle(client);

  let userRecord;
  try {
    [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, authUser.id))
      .limit(1);

    // If user doesn't exist, create them
    if (!userRecord) {
      await db.insert(user).values({
        id: authUser.id,
        email: authUser.email ?? "",
        onboarding_completed: false,
      });
      // Re-fetch the user record
      [userRecord] = await db
        .select()
        .from(user)
        .where(eq(user.id, authUser.id))
        .limit(1);
    }
  } catch {
    // If query fails, still show onboarding form
    // The form submission will handle creating the user
  }

  if (userRecord?.onboarding_completed) {
    redirect("/");
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-md">
        <OnboardingForm />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
          <div className="w-full max-w-md">Loading...</div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

