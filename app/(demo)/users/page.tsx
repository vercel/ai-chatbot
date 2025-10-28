"use client";

import { Suspense } from "react";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import UsersTable from "@/components/UsersTable";
import { USERS } from "@/lib/mockData";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl">User Management</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Manage platform users and their roles. Admins have full CMS and user
          access. Viewers have chat access only.
        </p>
      </div>

      <Suspense fallback={<TableSkeleton rows={8} />}>
        <UsersTable initialUsers={USERS} />
      </Suspense>
    </div>
  );
}
