import { auth } from '@/app/(auth)/auth';
import { conflictReport } from '@/lib/db/schema';
import { eq, count, and } from 'drizzle-orm';
import Link from 'next/link';
import { db } from '@/lib/db';

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user) {
    return null; // This should not happen due to layout guard, but for TypeScript
  }

  const stats = await Promise.all([
    db.select({ count: count() }).from(conflictReport).where(and(eq(conflictReport.status, 'pending'), eq(conflictReport.organizationId, session.user.organizationId))),
    db.select({ count: count() }).from(conflictReport).where(and(eq(conflictReport.status, 'under_review'), eq(conflictReport.organizationId, session.user.organizationId))),
    db.select({ count: count() }).from(conflictReport).where(and(eq(conflictReport.priority, 'high'), eq(conflictReport.status, 'pending'), eq(conflictReport.organizationId, session.user.organizationId))),
    db.select({ count: count() }).from(conflictReport).where(and(eq(conflictReport.priority, 'urgent'), eq(conflictReport.status, 'pending'), eq(conflictReport.organizationId, session.user.organizationId))),
  ]);

  const [pendingReports, underReviewReports, highPriorityReports, urgentReports] = stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back to {session?.user?.organizationName}
          </p>
        </div>
        <Link
          href="/admin/organization"
          className="inline-flex items-center justify-center rounded-md bg-muted px-4 py-2 text-sm font-medium text-muted-foreground shadow transition-colors hover:bg-muted/90"
        >
          Organization Settings
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Pending Reports</h3>
          </div>
          <div>
            <div className="text-2xl font-bold">{pendingReports[0].count}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Under Review</h3>
          </div>
          <div>
            <div className="text-2xl font-bold">{underReviewReports[0].count}</div>
            <p className="text-xs text-muted-foreground">
              Currently being processed
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">High Priority</h3>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{highPriorityReports[0].count}</div>
            <p className="text-xs text-muted-foreground">
              Needs attention
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Urgent</h3>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{urgentReports[0].count}</div>
            <p className="text-xs text-muted-foreground">
              Immediate action required
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/reports?status=pending"
            className="flex items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Review Pending Reports
          </Link>
          <Link
            href="/admin/reports?priority=urgent"
            className="flex items-center justify-center rounded-md bg-red-600 px-4 py-3 text-sm font-medium text-white shadow transition-colors hover:bg-red-700"
          >
            Handle Urgent Cases
          </Link>
          <Link
            href="/admin/reports"
            className="flex items-center justify-center rounded-md bg-muted px-4 py-3 text-sm font-medium text-muted-foreground shadow transition-colors hover:bg-muted/90"
          >
            View All Reports
          </Link>
        </div>
      </div>
    </div>
  );
}