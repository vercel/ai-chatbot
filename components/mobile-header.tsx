'use client';

import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MobileHeaderProps {
  toggleSidebar: () => void;
  title?: string;
}

export function MobileHeader({ toggleSidebar, title = 'Wizzo Chat' }: MobileHeaderProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  if (!isMobile) return null;
  
  return (
    <div className="sticky top-0 z-10 px-3 py-2 flex items-center border-b border-white/10 bg-[#2A5B34] text-white md:hidden">
      <button 
        className="p-1 mr-2 rounded-md hover:bg-white/10"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5 text-white" />
      </button>
      <h1 className="font-medium text-white truncate">{title}</h1>
    </div>
  );
}
