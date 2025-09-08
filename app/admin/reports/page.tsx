import { conflictReport } from '@/lib/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import Link from 'next/link';
import { formatDistance } from 'date-fns';
import { ReportFilters } from './filters';

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

interface SearchParams {
  status?: string;
  priority?: string;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const conditions = [];

  if (searchParams.status) {
    conditions.push(eq(conflictReport.status, searchParams.status as any));
  }

  if (searchParams.priority) {
    conditions.push(eq(conflictReport.priority, searchParams.priority as any));
  }

  const reports = await db
    .select()
    .from(conflictReport)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      desc(conflictReport.priority),
      desc(conflictReport.submittedAt)
    );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'requires_more_info': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conflict Reports</h1>
          <p className="text-muted-foreground">
            Manage and review conflict of interest reports
          </p>
        </div>
      </div>

      <ReportFilters />

      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  User
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Priority
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Status
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Submitted
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  <td className="p-4 align-middle">
                    <div>
                      <div className="font-medium">{report.userEmail}</div>
                      <div className="text-sm text-muted-foreground">
                        Report #{report.id.slice(0, 8)}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${getPriorityColor(report.priority)}`}>
                      {report.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${getStatusColor(report.status)}`}>
                      {report.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-sm text-muted-foreground">
                    {formatDistance(report.submittedAt, new Date(), { addSuffix: true })}
                  </td>
                  <td className="p-4 align-middle">
                    <Link
                      href={`/admin/reports/${report.id}`}
                      className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {reports.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No reports found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}