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
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
  SidebarProvider
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { BookOpen, MessageSquare, Video, Menu } from 'lucide-react';
import { IconWrapper } from './ui/icon-wrapper';
import { SidebarUserNav } from './sidebar-user-nav';
import { Button } from './ui/button';
import { SidebarHistory } from '@/components/sidebar-history';

export function AppSidebar({ 
  user, 
  children 
}: { 
  user: User | undefined, 
  children?: React.ReactNode 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSecondaryOpen, setIsSecondaryOpen] = useState(true);
  const [open, setOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<'threads' | 'knowledge' | 'meets' | null>(null);
  
  // Determine the active section based on the current pathname
  useEffect(() => {
    if (pathname === '/' || pathname.startsWith('/chat')) {
      setActiveSection('threads');
    } else if (pathname.startsWith('/knowledge')) {
      setActiveSection('knowledge');
    } else if (pathname.startsWith('/meets')) {
      setActiveSection('meets');
    } else {
      setActiveSection(null);
    }
  }, [pathname]);

  // Navigate directly to the section pages
  const handleSectionClick = (section: 'threads' | 'knowledge' | 'meets') => {
    if (section === 'threads') {
      router.push('/');
    } else if (section === 'knowledge') {
      router.push('/knowledge');
    } else if (section === 'meets') {
      router.push('/meets');
    }
    
    setActiveSection(section);
  };

  return (
    <SidebarProvider>
      <div className="flex h-full">
      {/* Main sidebar with minimal width */}
      <Sidebar 
        className="h-full border-r-0 wizzo-sidebar"
        collapsible="none"
        variant="sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Top header with logo */}
          <div className="flex items-center px-3 h-[60px] border-b border-hunter_green-600">
            <Link href="/" className="flex items-center">
              <span className="font-bold text-xl text-cornsilk-500">
                WIZZO
              </span>
            </Link>
            
            <IconWrapper 
              icon={Menu}
              className="ml-auto size-5 cursor-pointer hover:text-cornsilk-200" 
              onClick={() => setIsSecondaryOpen(!isSecondaryOpen)} 
            />
          </div>
          
          {/* Navigation buttons */}
          <div className="flex flex-col pt-4 space-y-1">
            <button
              className={`flex items-center py-2 px-3 hover:bg-hunter_green-600 transition-colors ${
                activeSection === 'threads' ? 'bg-hunter_green-700' : ''
              }`}
              onClick={() => handleSectionClick('threads')}
              aria-label="Threads"
            >
              <IconWrapper icon={MessageSquare} className="size-5 text-cornsilk-500" strokeWidth={2.2} />
            </button>
            
            <button
              className={`flex items-center py-2 px-3 hover:bg-hunter_green-600 transition-colors ${
                activeSection === 'knowledge' ? 'bg-hunter_green-700' : ''
              }`}
              onClick={() => handleSectionClick('knowledge')}
              aria-label="Knowledge Base"
            >
              <IconWrapper icon={BookOpen} className="size-5 text-cornsilk-500" strokeWidth={2.2} />
            </button>
            
            <button
              className={`flex items-center py-2 px-3 hover:bg-hunter_green-600 transition-colors ${
                activeSection === 'meets' ? 'bg-hunter_green-700' : ''
              }`}
              onClick={() => handleSectionClick('meets')}
              aria-label="Meets"
            >
              <IconWrapper icon={Video} className="size-5 text-cornsilk-500" strokeWidth={2.2} />
            </button>
          </div>
          
          {/* User navigation at bottom */}
          <div className="mt-auto pb-4 px-2">
            {user && <SidebarUserNav user={user} />}
          </div>
        </div>
      </Sidebar>
      
      {/* Secondary sidebar */}
      {isSecondaryOpen && activeSection && activeSection !== 'meets' && (
        <div className="w-60 h-full overflow-y-auto border-r border-hunter_green-600 bg-hunter_green-500 wizzo-sidebar-secondary">
          {activeSection === 'threads' && (
            <div className="h-full">
              <div className="flex items-center justify-between p-3 h-[60px] border-b border-hunter_green-600">
                <h2 className="font-semibold text-cornsilk-500">Conversations</h2>
                <Link href="/">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="p-1 h-8 w-8 rounded-full text-cornsilk-500 hover:bg-hunter_green-600"
                  >
                    <PlusIcon className="size-5" />
                    <span className="sr-only">New Chat</span>
                  </Button>
                </Link>
              </div>
              
              <SidebarHistory user={user} />
            </div>
          )}
          
          {activeSection === 'knowledge' && (
            <div className="h-full">
              <div className="flex items-center justify-between p-3 h-[60px] border-b border-hunter_green-600">
                <h2 className="font-semibold text-cornsilk-500">Knowledge Base</h2>
                <Link href="/knowledge">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="p-1 h-8 w-8 rounded-full text-cornsilk-500 hover:bg-hunter_green-600"
                  >
                    <PlusIcon className="size-5" />
                    <span className="sr-only">Add Document</span>
                  </Button>
                </Link>
              </div>
              
              <div className="p-3">
                <Link 
                  href="/knowledge/category/text" 
                  className="block py-2 px-3 mb-1 rounded hover:bg-hunter_green-600 transition-colors"
                >
                  Text Documents
                </Link>
                <Link 
                  href="/knowledge/category/audio" 
                  className="block py-2 px-3 mb-1 rounded hover:bg-hunter_green-600 transition-colors"
                >
                  Audio Files
                </Link>
                <Link 
                  href="/knowledge/category/web" 
                  className="block py-2 px-3 mb-1 rounded hover:bg-hunter_green-600 transition-colors"
                >
                  Web Content
                </Link>
                <Link 
                  href="/knowledge" 
                  className="block py-2 px-3 mb-1 rounded hover:bg-hunter_green-600 transition-colors"
                >
                  All Documents
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Main content */}
      <main className="flex-1 h-full overflow-auto">
        {children}
      </main>
    </div>
    </SidebarProvider>
  );
}
