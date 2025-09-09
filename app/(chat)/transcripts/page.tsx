import { withAuth } from '@workos-inc/authkit-nextjs';
import { TranscriptsList } from './components/transcripts-list';

export default async function TranscriptsPage() {
  const session = await withAuth({ ensureSignedIn: true });
  const { user } = session;

  // Role-based access check
  const isMemberRole = session.role === 'member';
  console.log(
    `📋 Transcripts page - User ${user.email} has role '${session.role}' (${isMemberRole ? 'MEMBER - limited access' : 'ELEVATED - full access'})`,
  );

  return (
    <div className="container mx-auto px-12 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Meeting Transcripts</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your Zoom meeting transcripts
        </p>
      </div>

      <TranscriptsList isMember={isMemberRole} />
    </div>
  );
}
