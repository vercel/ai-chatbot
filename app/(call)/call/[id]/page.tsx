import { notFound } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';

export default async function CallPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { id } = params;
  const session = await auth();

  if (!session || !session.user) {
    return notFound();
  }

  return (
    <div className="flex size-full flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Call Identifier</h1>
        <p className="mt-2 text-muted-foreground">Call ID: {id}</p>
      </div>
    </div>
  );
}
