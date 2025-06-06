/**
 * @file components/app-sidebar.tsx
 * @description Компонент боковой панели приложения с навигацией.
 * @version 1.6.1
 * @date 2025-06-06
 * @updated Исправлена ошибка TS2322 (несуществующий пропс `className` у иконок).
 */

/** HISTORY:
 * v1.6.1 (2025-06-06): Исправлена передача `className` иконкам.
 * v1.6.0 (2025-06-06): Исправлены импорты удаленных компонентов, заменен SidebarMenuSkeleton на Skeleton.
 * v1.5.0 (2025-06-05): Удален UserNav и логотип (перенесены в Header), триггер в футере выровнен по правому краю.
 * v1.4.1 (2025-06-05): Добавлена опция { initializeWithValue: false } к useLocalStorage для исправления ошибки гидратации.
 * v1.4.0 (2025-06-05): Удален UserNav и логотип, триггер в футере выровнен по правому краю.
 * v1.3.1 (2025-06-05): Добавлена подсветка активной иконки в свернутом режиме.
 * v1.3.0 (2025-06-05): Перемещен SidebarTrigger в футер, исправлена анимация шевронов и отображение иконок в свернутом виде.
 */

'use client';

import type { User } from 'next-auth';
import { useRouter, usePathname } from 'next/navigation';
import {
  ChevronDownIcon,
  MessageCircleIcon,
  FileTextIcon,
  ChevronLeftIcon,
} from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  useSidebar,
  SidebarTrigger,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { useLocalStorage } from 'usehooks-ts';
import type { Document as DBDocument } from '@/lib/db/schema';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import { useArtifact } from '@/hooks/use-artifact';
import { Skeleton } from '@/components/ui/skeleton';

interface SidebarTextDocumentItemProps {
  document: Pick<DBDocument, 'id' | 'title' | 'createdAt' | 'kind' | 'content'>;
  isActive: boolean;
  onClick: () => void;
}

function SidebarTextDocumentItem({ document: doc, isActive, onClick }: SidebarTextDocumentItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={{
          children: doc.title,
          side: 'right',
          align: 'center',
        }}
      >
        <button type="button" onClick={onClick} className="w-full text-left">
          <span>{doc.title}</span>
        </button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile, state: sidebarState } = useSidebar();

  const [isChatSectionCollapsed, setIsChatSectionCollapsed] = useLocalStorage(
    'sidebar:isChatSectionCollapsed',
    false,
    { initializeWithValue: false }
  );
  const [isTextSectionCollapsed, setIsTextSectionCollapsed] = useLocalStorage(
    'sidebar:isTextSectionCollapsed',
    true,
    { initializeWithValue: false }
  );

  const isChatActive = pathname.startsWith('/chat') || pathname === '/';
  const isNotesActive = pathname.startsWith('/notes');

  const {
    data: recentTextDocuments,
    isLoading: isLoadingRecentDocuments,
  } = useSWR<Array<Pick<DBDocument, 'id' | 'title' | 'createdAt' | 'kind' | 'content'>>>(
    user ? `/api/documents/recent?kind=text&limit=5` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const handleTextDocumentClick = (doc: Pick<DBDocument, 'id' | 'title' | 'kind' | 'content'>) => {
    if (!doc.kind) {
      console.error("SYS_COMP_APP_SIDEBAR: Document kind is undefined, cannot open artifact.", doc);
      return;
    }
    router.push(`/notes?openDocId=${doc.id}`);
    setOpenMobile(false);
  };

  const artifactHook = useArtifact();
  const activeDocumentId = artifactHook.artifact.isVisible && artifactHook.artifact.kind === 'text' ? artifactHook.artifact.documentId : null;

  return (
    <Sidebar>
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                if (sidebarState === 'collapsed') {
                  router.push('/');
                } else {
                  setIsChatSectionCollapsed(!isChatSectionCollapsed);
                }
                setOpenMobile(false);
              }}
              isActive={isChatActive}
              tooltip={{ children: 'AI Чат', side: 'right' }}
              className="justify-between"
            >
              <div className="flex items-center gap-2">
                <MessageCircleIcon size={18} />
                {sidebarState === 'expanded' && <span>AI Чат</span>}
              </div>
              {sidebarState === 'expanded' && (
                <ChevronDownIcon
                  size={16}
                  className={`transition-transform duration-200 ${
                    isChatSectionCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                />
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          {!isChatSectionCollapsed && sidebarState === 'expanded' && (
            <SidebarHistory user={user} />
          )}
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  if (sidebarState === 'collapsed') {
                    router.push('/notes');
                  } else {
                    setIsTextSectionCollapsed(!isTextSectionCollapsed);
                  }
                  setOpenMobile(false);
                }}
                isActive={isNotesActive}
                tooltip={{ children: 'Заметки', side: 'right' }}
                className="justify-between"
              >
                <div className="flex items-center gap-2">
                  <FileTextIcon size={18} />
                  {sidebarState === 'expanded' && <span>Заметки</span>}
                </div>
                {sidebarState === 'expanded' && (
                  <ChevronDownIcon
                    size={16}
                    className={`transition-transform duration-200 ${
                      isTextSectionCollapsed ? '-rotate-90' : 'rotate-0'
                    }`}
                  />
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
            {!isTextSectionCollapsed && sidebarState === 'expanded' && (
                <SidebarMenu>
                  {isLoadingRecentDocuments && (
                    <div className="flex flex-col gap-1 px-2">
                      <Skeleton className="h-7 w-4/5" />
                      <Skeleton className="h-7 w-3/5" />
                    </div>
                  )}
                  {!isLoadingRecentDocuments && recentTextDocuments?.map((doc) => (
                    <SidebarTextDocumentItem
                      key={doc.id}
                      document={doc}
                      isActive={activeDocumentId === doc.id}
                      onClick={() => handleTextDocumentClick(doc)}
                    />
                  ))}
                  {!isLoadingRecentDocuments && (!recentTextDocuments || recentTextDocuments.length === 0) && (
                     <div className="px-2 py-1 text-xs text-sidebar-foreground/70 text-center">Нет недавних заметок.</div>
                  )}
                  <SidebarMenuItem className="mt-1">
                    <SidebarMenuButton
                        onClick={() => {
                            router.push('/notes');
                            setOpenMobile(false);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full justify-center"
                    >
                        <span>Все заметки</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
            )}
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarTrigger className="ml-auto hidden md:flex">
          <ChevronLeftIcon className={`transition-transform duration-200 ${sidebarState === 'collapsed' ? 'rotate-180' : 'rotate-0'}`} />
        </SidebarTrigger>
      </SidebarFooter>
    </Sidebar>
  );
}

// END OF: components/app-sidebar.tsx
