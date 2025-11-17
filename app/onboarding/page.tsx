import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { user, workspace } from "@/lib/db/schema";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { resolveTenantContext } from "@/lib/server/tenant/context";
import { getResourceStore } from "@/lib/server/tenant/resource-store";
import { eq } from "drizzle-orm";

async function OnboardingContent() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/signin");
  }

  // Check if user already completed onboarding
  let userRecord;
  let workspaceRecord;
  try {
    const tenant = await resolveTenantContext();
    const store = await getResourceStore(tenant);
    try {
      [userRecord] = await store.withSqlClient((db) =>
        db.select().from(user).where(eq(user.id, authUser.id)).limit(1),
      );

      if (!userRecord) {
        await store.withSqlClient((db) =>
          db.insert(user).values({
            id: authUser.id,
            email: authUser.email ?? "",
            onboarding_completed: false,
          }),
        );

        [userRecord] = await store.withSqlClient((db) =>
          db.select().from(user).where(eq(user.id, authUser.id)).limit(1),
        );
      }

      [workspaceRecord] = await store.withSqlClient((db) =>
        db.select().from(workspace).where(eq(workspace.id, tenant.workspaceId)).limit(1),
      );
    } finally {
      await store.dispose();
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
        <OnboardingForm
          initialValues={{
            firstname: userRecord?.firstname ?? "",
            lastname: userRecord?.lastname ?? "",
            job_title: userRecord?.job_title ?? "",
            profile_pic_url: userRecord?.avatar_url ?? "",
            role_experience: userRecord?.ai_context ?? "",
            technical_proficiency: (userRecord?.proficiency as
              | "less"
              | "regular"
              | "more"
              | undefined) ?? "regular",
            tone_of_voice: userRecord?.ai_tone ?? "",
            ai_generation_guidance: userRecord?.ai_guidance ?? "",
            workspace_name: workspaceRecord?.name ?? "My Workspace",
            workspace_profile_pic_url: workspaceRecord?.avatar_url ?? "",
            business_description: workspaceRecord?.description ?? "",
          }}
        />
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

