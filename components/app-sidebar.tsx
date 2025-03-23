'use client';

import type { User } from 'next-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

import { PlusIcon } from '@/components/icons';
import {
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarProvider
} from '@/components/ui/sidebar';
import { BookOpen, MessageSquare, Menu, Plus } from 'lucide-react';
import { IconWrapper } from './ui/icon-wrapper';
import { SidebarUserNav } from './sidebar-user-nav';
import { Button } from './ui/button';
import { SidebarHistory } from '@/components/sidebar-history';
import { ScrollArea } from './ui/scroll-area';
import { MobileHeader } from './mobile-header';

export function AppSidebar({ 
  user, 
  children 
}: { 
  user: User | undefined, 
  children?: React.ReactNode 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'threads' | 'knowledge' | null>(null);
  
  // Check if mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Check if mobile on first render and on resize
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-close sidebar on mobile
      if (window.innerWidth < 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    // Initial check
    checkIfMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Determine the active section based on the current pathname
  useEffect(() => {
    if (pathname === '/' || pathname.startsWith('/chat')) {
      setActiveSection('threads');
    } else if (pathname.startsWith('/knowledge')) {
      setActiveSection('knowledge');
    } else {
      setActiveSection(null);
    }

    // Ensure sidebar is visible when navigating to any section
    if (isMobile) {
      setIsMobileMenuOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [pathname, isMobile]);

  // Ensure the sidebar state is synchronized with window resize
  useEffect(() => {
    if (!isMobile && !isSidebarOpen) {
      setIsSidebarOpen(true);
    }
  }, [isMobile, isSidebarOpen]);

  // Create a new chat
  const handleNewChat = () => {
    router.push('/');
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };
  
  // Toggle sidebar
  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
    // Force layout recalculation
    window.setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
  };
  
  // Close mobile menu when navigating
  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };
  
  // Get page title based on active section
  const getPageTitle = () => {
    switch (activeSection) {
      case 'threads':
        return 'Wizzo Chat';
      case 'knowledge':
        return 'Knowledge Base';
      default:
        return 'Wizzo';
    }
  };
  


  return (
    <SidebarProvider>
      <div className="flex h-full relative">
        {/* Mobile overlay */}
        {isMobile && (
          <div 
            className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        {/* Mobile menu toggle */}
        {isMobile && (
          <button 
            className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-[#2A5B34] shadow-sm border border-white/10"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
        )}
        
        {/* Main sidebar with ChatGPT-like styling */}
        <div className={`chatgpt-sidebar fixed md:relative ${isMobile ? (isMobileMenuOpen ? 'chatgpt-sidebar-open' : '') : (isSidebarOpen ? 'chatgpt-sidebar-open' : 'chatgpt-sidebar-closed')} h-full flex flex-col border-r border-gray-200 dark:border-gray-700/50 transition-all duration-300 ease-in-out bg-[#2A5B34] text-cornsilk-500 z-50`}>
          {/* New Chat button and Toggle */}
          <div className="p-2">
            <button
              onClick={handleNewChat}
              className="flex w-full items-center rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium shadow-sm hover:bg-white/20 transition-colors group"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className={`${isMobile || isSidebarOpen ? 'block' : 'hidden'} flex-1 text-left`}>New chat</span>
              {/* Removed redundant sidebar toggle */}
            </button>
          </div>

          {/* History list */}
          <div className={`flex-1 overflow-hidden ${isMobile || isSidebarOpen ? 'block' : 'hidden'}`}>
            <ScrollArea className="h-full px-2">
              {user && <SidebarHistory user={user} />}
            </ScrollArea>
          </div>

          {/* Bottom section with buttons and user profile */}
          <div className={`border-t border-white/10 ${isMobile || isSidebarOpen ? 'p-2' : 'p-1'}`}>
            {/* Main feature buttons */}
            <div className={`flex ${isMobile || isSidebarOpen ? 'flex-col space-y-1' : 'flex-col items-center space-y-3'} mb-2`}>
              <button
                className={`flex items-center rounded-md px-3 py-2 text-sm ${isMobile || isSidebarOpen ? 'justify-start w-full' : 'justify-center'} ${
                  activeSection === 'threads' 
                    ? 'bg-white/20 text-white font-medium' 
                    : 'text-white/80 hover:bg-white/10'
                }`}
                onClick={() => handleNavigation('/')}
              >
                <MessageSquare className={`h-4 w-4 ${isMobile || isSidebarOpen ? 'mr-2' : ''}`} />
                {(isMobile || isSidebarOpen) && <span>Chats</span>}
              </button>
              
              <button
                className={`flex items-center rounded-md px-3 py-2 text-sm ${isMobile || isSidebarOpen ? 'justify-start w-full' : 'justify-center'} ${
                  activeSection === 'knowledge' 
                    ? 'bg-white/20 text-white font-medium' 
                    : 'text-white/80 hover:bg-white/10'
                }`}
                onClick={() => handleNavigation('/knowledge')}
              >
                <BookOpen className={`h-4 w-4 ${isMobile || isSidebarOpen ? 'mr-2' : ''}`} />
                {(isMobile || isSidebarOpen) && <span>Knowledge</span>}
              </button>
            </div>
            
            {/* User avatar and profile */}
            <div className={`mt-2 ${isMobile || isSidebarOpen ? '' : 'flex justify-center'}`}>
              {user && <SidebarUserNav user={user} isCollapsed={!isMobile && !isSidebarOpen} />}
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <main className="flex-1 h-full overflow-auto relative flex flex-col w-full">
          <MobileHeader toggleSidebar={toggleSidebar} title={getPageTitle()} />
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
