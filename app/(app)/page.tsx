import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { user } from "@/lib/db/schema";
import MarketingPage from "@/components/marketing/landing-page";
import DashboardContent from "../dashboard-content";

async function RootPageContent() {
  const authUser = await getAuthenticatedUser();

  // If not authenticated, show marketing page
  if (!authUser) {
    return <MarketingPage />;
  }

  // If authenticated, check onboarding status
  const client = postgres(process.env.POSTGRES_URL!);
  const db = drizzle(client);

  let userRecord;
  try {
    [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, authUser.id))
      .limit(1);
  } catch {
    // If query fails, redirect to onboarding
    redirect("/onboarding");
  }

  // If user doesn't exist or hasn't completed onboarding, redirect
  if (!userRecord?.onboarding_completed) {
    redirect("/onboarding");
  }

  // Show dashboard content (will be wrapped by (app) layout)
  return <DashboardContent />;
}

export default function RootPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin">Loading...</div>
        </div>
      }
    >
      <RootPageContent />
    </Suspense>
  );
}

