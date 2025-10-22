import CmsTabs from "@/components/CmsTabs";
import { APPROVED_DOCS, PENDING_DOCS } from "@/lib/mockData";

export default function CMSPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl">Knowledge Base</h1>
        <p className="mt-1 text-muted-foreground">
          Manage approved content and review pending discoveries
        </p>
      </div>

      <CmsTabs approvedDocs={APPROVED_DOCS} pendingDocs={PENDING_DOCS} />
    </div>
  );
}
