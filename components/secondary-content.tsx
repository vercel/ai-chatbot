'use client';

import { useParams, usePathname } from 'next/navigation';
import type { User } from 'next-auth';
import Link from 'next/link';
import useSWR from 'swr';
import { File, Headphones, FileText, Globe, Youtube } from 'lucide-react';

import { SidebarHistory } from '@/components/sidebar-history';
import { 
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { KnowledgeDocument } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { Separator } from './ui/separator';

interface SecondaryContentProps {
  section: 'threads' | 'knowledge';
  user: User | undefined;
}

export function SecondaryContent({ section, user }: SecondaryContentProps) {
  const { id } = useParams();
  const pathname = usePathname();
  
  // For Knowledge Base section
  const { data: documents, isLoading } = useSWR<KnowledgeDocument[]>(
    section === 'knowledge' ? '/api/knowledge' : null, 
    fetcher,
    { fallbackData: [] }
  );
  
  // Group knowledge documents by type
  const textDocuments = documents?.filter(doc => 
    doc.sourceType === 'text' || doc.sourceType === 'pdf' || doc.sourceType === 'url'
  );
  
  const audioFiles = documents?.filter(doc => 
    doc.sourceType === 'audio' || doc.sourceType === 'video' || doc.sourceType === 'youtube'
  );

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4 mr-2" />;
      case 'pdf':
        return <File className="h-4 w-4 mr-2" />;
      case 'url':
        return <Globe className="h-4 w-4 mr-2" />;
      case 'youtube':
        return <Youtube className="h-4 w-4 mr-2" />;
      case 'audio':
      case 'video':
        return <Headphones className="h-4 w-4 mr-2" />;
      default:
        return <File className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <div className="secondary-content">
      <Separator className="mb-2" />
      <h3 className="text-sm font-medium mb-2 px-2">
        {section === 'threads' ? 'Conversations' : 'Categories'}
      </h3>
      
      {section === 'threads' ? (
        // Threads section displays chat history
        <SidebarHistory user={user} />
      ) : (
        // Knowledge Base section with document categories
        <>
          {/* Text Documents Section */}
          <SidebarGroup>
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Text Documents
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {textDocuments && textDocuments.length > 0 ? (
                  textDocuments.slice(0, 5).map((doc) => (
                    <SidebarMenuItem key={doc.id}>
                      <SidebarMenuButton asChild isActive={pathname === `/knowledge/${doc.id}`}>
                        <Link href={`/knowledge/${doc.id}`} className="flex items-center">
                          {getDocumentIcon(doc.sourceType)}
                          <span className="truncate">{doc.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-2 text-muted-foreground text-sm">
                    No text documents found
                  </div>
                )}
                
                {textDocuments && textDocuments.length > 5 && (
                  <div className="mt-2 px-2">
                    <Link href="/knowledge">
                      <Button variant="ghost" size="sm" className="w-full text-xs">
                        View all ({textDocuments.length})
                      </Button>
                    </Link>
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          {/* Audio Files Section */}
          <SidebarGroup>
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground mt-2">
              Audio Files
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {audioFiles && audioFiles.length > 0 ? (
                  audioFiles.slice(0, 5).map((doc) => (
                    <SidebarMenuItem key={doc.id}>
                      <SidebarMenuButton asChild isActive={pathname === `/knowledge/${doc.id}`}>
                        <Link href={`/knowledge/${doc.id}`} className="flex items-center">
                          {getDocumentIcon(doc.sourceType)}
                          <span className="truncate">{doc.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-2 text-muted-foreground text-sm">
                    No audio files found
                  </div>
                )}
                
                {audioFiles && audioFiles.length > 5 && (
                  <div className="mt-2 px-2">
                    <Link href="/knowledge">
                      <Button variant="ghost" size="sm" className="w-full text-xs">
                        View all ({audioFiles.length})
                      </Button>
                    </Link>
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </>
      )}
    </div>
  );
}
