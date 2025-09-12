import { withAuth } from '@workos-inc/authkit-nextjs';
import Link from 'next/link';
import { getPublicAgents } from '@/lib/db/queries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  await withAuth({ ensureSignedIn: true });

  const q = typeof searchParams?.q === 'string' ? searchParams?.q : undefined;
  const page = Number.parseInt(
    typeof searchParams?.page === 'string' ? searchParams.page : '1',
    10,
  );

  const { data } = await getPublicAgents({ q, limit: 50, offset: (page - 1) * 50 });

  return (
    <div className="p-4 md:p-6">
      <form className="mb-4 flex gap-2" action="/agents">
        <Input name="q" placeholder="Search agents" defaultValue={q} />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map((a) => (
          <div key={a.id} className="border rounded-lg p-4">
            <div className="font-semibold text-lg">{a.name}</div>
            {a.description && (
              <div className="text-muted-foreground text-sm mt-1">
                {a.description}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <Link href={`/agents/${a.slug}`} className="w-full">
                <Button className="w-full">View</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
      {data.length === 0 && (
        <div className="text-muted-foreground">No agents found.</div>
      )}
    </div>
  );
}

