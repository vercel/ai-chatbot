'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export function ProfileHeader() {
  const { data: session } = useSession();
  const [greeting, setGreeting] = useState('');
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);
  
  return (
    <div className="flex flex-row gap-4 items-center">
      <div className="relative">
        <Image
          src={`https://avatar.vercel.sh/${session?.user?.email}`}
          alt={session?.user?.email ?? 'User Avatar'}
          width={60}
          height={60}
          className="rounded-full border-2 border-muted"
        />
      </div>
      
      <div className="flex flex-col">
        <h1 className="text-xl font-bold">{greeting}, {session?.user?.email?.split('@')[0]}</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account settings and preferences
        </p>
      </div>
    </div>
  );
} 