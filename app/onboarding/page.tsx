import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { user, workspace } from "@/lib/db/schema";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getAppMode, resolveTenantContext } from "@/lib/server/tenant/context";
import { getResourceStore } from "@/lib/server/tenant/resource-store";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

async function OnboardingContent() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/signin");
  }

  // Check if user already completed onboarding
  // In hosted mode, user and workspace are system tables in main database
  // In local mode, they're in tenant database via resource store
  let userRecord;
  let workspaceRecord;
  const mode = getAppMode();
  const tenant = await resolveTenantContext();

  try {
    if (mode === "hosted") {
      // Query from main database directly
      const sql = postgres(process.env.POSTGRES_URL!);
      const db = drizzle(sql);

      try {
        [userRecord] = await db
          .select()
          .from(user)
          .where(eq(user.id, authUser.id))
          .limit(1);

        if (!userRecord) {
          await db.insert(user).values({
            id: authUser.id,
            email: authUser.email ?? "",
            onboarding_completed: false,
          });

          [userRecord] = await db
            .select()
            .from(user)
            .where(eq(user.id, authUser.id))
            .limit(1);
        }

        [workspaceRecord] = await db
          .select()
          .from(workspace)
          .where(eq(workspace.id, tenant.workspaceId))
          .limit(1);
      } finally {
        await sql.end({ timeout: 5 });
      }
    } else {
      // Local mode: use resource store
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

