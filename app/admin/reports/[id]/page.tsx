import { auth } from '@/app/(auth)/auth';
import { conflictReport, reviewResponse, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { formatDistance } from 'date-fns';
import { ReviewActions } from './review-actions';
import Link from 'next/link';
import { Response } from '@/components/elements/response';
import { db } from '@/lib/db';

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user || !['compliance_officer', 'admin'].includes(session.user.role)) {
    return notFound();
  }

  const [report] = await db
    .select()
    .from(conflictReport)
    .where(eq(conflictReport.id, id));

  if (!report) {
    return notFound();
  }

  const responses = await db
    .select({
      id: reviewResponse.id,
      actionType: reviewResponse.actionType,
      responseContent: reviewResponse.responseContent,
      createdAt: reviewResponse.createdAt,
      reviewerEmail: user.email,
      isFromUser: reviewResponse.isFromUser,
      emailId: reviewResponse.emailId,
    })
    .from(reviewResponse)
    .leftJoin(user, eq(reviewResponse.reviewerId, user.id))
    .where(eq(reviewResponse.conflictReportId, id))
    .orderBy(reviewResponse.createdAt);

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
          <Link href="/admin/reports" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Reports
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">
            Conflict Report Review
          </h1>
          <p className="text-muted-foreground">
            Report #{report.id.slice(0, 8)}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${getPriorityColor(report.priority)}`}>
            {report.priority.toUpperCase()}
          </span>
          <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${getStatusColor(report.status)}`}>
            {report.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Report Details</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">User Email</div>
                <p className="text-sm">{report.userEmail}</p>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Submitted</div>
                <p className="text-sm">
                  {formatDistance(report.submittedAt, new Date(), { addSuffix: true })} 
                  ({report.submittedAt.toLocaleDateString()})
                </p>
              </div>
              {report.reviewedAt && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Reviewed</div>
                  <p className="text-sm">
                    {formatDistance(report.reviewedAt, new Date(), { addSuffix: true })}
                    ({report.reviewedAt.toLocaleDateString()})
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Report Content</h2>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <Response>{report.content}</Response>
            </div>
          </div>

          {responses.length > 0 && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Review History</h2>
              <div className="space-y-4">
                {responses.map((response) => (
                  <div 
                    key={response.id} 
                    className={`border-l-4 pl-4 ${
                      response.isFromUser 
                        ? 'border-blue-400 bg-blue-50/50' 
                        : 'border-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {response.isFromUser 
                            ? 'USER RESPONSE'
                            : response.actionType.replace('_', ' ').toUpperCase()}
                        </span>
                        {response.isFromUser && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            via email
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        by {response.isFromUser ? report.userEmail : response.reviewerEmail} • {formatDistance(response.createdAt, new Date(), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {response.responseContent}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <ReviewActions reportId={report.id} currentStatus={report.status} />
        </div>
      </div>
    </div>
  );
}