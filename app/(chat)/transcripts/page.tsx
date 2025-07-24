import { withAuth } from '@workos-inc/authkit-nextjs';
import { TranscriptsList } from './components/transcripts-list';

export default async function TranscriptsPage() {
  const { user } = await withAuth({ ensureSignedIn: true });

  return (
    <div className="container mx-auto px-12 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Meeting Transcripts</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your Zoom meeting transcripts
        </p>
      </div>

      <TranscriptsList />
    </div>
  );
}
