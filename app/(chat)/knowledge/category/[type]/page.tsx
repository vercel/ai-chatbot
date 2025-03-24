'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CategoryPage({ params }: { params: { type: string } }) {
  const router = useRouter();

  // Immediately redirect to the main knowledge page
  useEffect(() => {
    router.push('/knowledge');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}