'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

    if (!token && !isAuthPage) {
      router.push('/login');
    }

    if (token && isAuthPage) {
      router.push('/');
    }
  }, [pathname, router]);

  return <>{children}</>;
}; 