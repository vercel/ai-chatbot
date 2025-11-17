import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import MarketingPage from "@/components/marketing/landing-page";
import DashboardContent from "../dashboard-content";
import { resolveTenantContext } from "@/lib/server/tenant/context";
import { getResourceStore } from "@/lib/server/tenant/resource-store";

async function RootPageContent() {
  const authUser = await getAuthenticatedUser();

  // If not authenticated, show marketing page
  if (!authUser) {
    return <MarketingPage />;
  }

  // If authenticated, check onboarding status
  let userRecord;
  try {
    const tenant = await resolveTenantContext();
    const store = await getResourceStore(tenant);
    try {
      [userRecord] = await store.withSqlClient((db) =>
        db.select().from(user).where(eq(user.id, authUser.id)).limit(1)
      );
    } finally {
      await store.dispose();
    }
  } catch {
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

