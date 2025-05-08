'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ProfileDialog } from './profile-dialog';

export function ProfileAutoOpener() {
  const { data, status } = useSession();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  useEffect(() => {
    // Check if we should open the profile dialog based on the URL
    const shouldOpenProfile = searchParams.get('openProfile') === 'true' || 
                            pathname === '/profile';
    
    if (shouldOpenProfile && status === 'authenticated' && data?.user) {
      setIsProfileOpen(true);
      
      // Clean up the URL if needed
      if (pathname !== '/') {
        router.push('/');
      }
    }
  }, [searchParams, pathname, status, data, router]);
  
  if (status !== 'authenticated' || !data?.user) {
    return null;
  }
  
  return (
    <ProfileDialog
      user={data.user}
      isOpen={isProfileOpen}
      onClose={() => {
        setIsProfileOpen(false);
        // Clean up URL parameter if it exists
        if (searchParams.get('openProfile')) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('openProfile');
          router.replace(newUrl.pathname + newUrl.search);
        }
      }}
    />
  );
} 