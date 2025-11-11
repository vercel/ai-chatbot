import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { user } from "@/lib/db/schema";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export default async function OnboardingPage() {
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

  const [userRecord] = await db
    .select()
    .from(user)
    .where(eq(user.id, authUser.id))
    .limit(1);

  if (userRecord?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-md">
        <OnboardingForm />
      </div>
    </div>
  );
}

