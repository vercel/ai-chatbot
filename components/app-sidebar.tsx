/**
 * @file components/app-sidebar.tsx
 * @description Компонент боковой панели приложения с навигацией.
 * @version 1.8.0
 * @date 2025-06-06
 * @updated Восстановлена правильная HTML-структура (SidebarMenuItem внутри SidebarMenu) для устранения маркеров списка.
 */

/** HISTORY:
 * v1.8.0 (2025-06-06): Исправлена структура SidebarMenu/SidebarMenuItem для устранения бага с маркерами.
 * v1.7.0 (2025-06-06): Рефакторинг "Заметки" -> "Контент". Обновлены API-вызовы, ссылки и иконка.
 * v1.6.1 (2025-06-06): Исправлена передача `className` иконкам.
 */

'use client'

import type { User } from 'next-auth'
import { usePathname, useRouter } from 'next/navigation'
import { BoxIcon, ChevronDownIcon, ChevronLeftIcon, MessageCircleIcon, } from '@/components/icons'
import { SidebarHistory } from '@/components/sidebar-history'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { useLocalStorage } from 'usehooks-ts'
import type { Document as DBDocument } from '@/lib/db/schema'
import useSWR from 'swr'
import { fetcher } from '@/lib/utils'
import { useArtifact } from '@/hooks/use-artifact'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from './toast'
import type { ArtifactKind } from './artifact'

interface SidebarContentItemProps {
  document: Pick<DBDocument, 'id' | 'title' | 'createdAt' | 'kind' | 'content'>;
  isActive: boolean;
  onClick: () => void;
}

function SidebarContentItem ({ document: doc, isActive, onClick }: SidebarContentItemProps) {
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
  )
}

export function AppSidebar ({ user }: { user: User | undefined }) {
  const router = useRouter()
  const pathname = usePathname()
  const { setOpenMobile, state: sidebarState } = useSidebar()

  const [isChatSectionCollapsed, setIsChatSectionCollapsed] = useLocalStorage(
    'sidebar:isChatSectionCollapsed',
    false,
    { initializeWithValue: false }
  )
  const [isContentSectionCollapsed, setIsContentSectionCollapsed] = useLocalStorage(
    'sidebar:isContentSectionCollapsed',
    true,
    { initializeWithValue: false }
  )

  const isChatActive = pathname.startsWith('/chat') || pathname === '/'
  const isContentActive = pathname.startsWith('/content')

  const {
    data: recentContent,
    isLoading: isLoadingRecentContent,
  } = useSWR<Array<Pick<DBDocument, 'id' | 'title' | 'createdAt' | 'kind' | 'content'>>>(
    user ? `/api/content/recent?limit=5` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const { setArtifact } = useArtifact()
  const artifactHook = useArtifact()
  const activeDocumentId = artifactHook.artifact.isVisible ? artifactHook.artifact.documentId : null

  const handleContentClick = (doc: Pick<DBDocument, 'id' | 'title' | 'kind' | 'content'>) => {
    if (!doc.kind) {
      console.error('SYS_COMP_APP_SIDEBAR: Document kind is undefined, cannot open artifact.', doc)
      toast({ type: 'error', description: 'Не удалось определить тип контента.' })
      return
    }
    toast({ type: 'loading', description: `Открываю "${doc.title}"...` })
    router.push(`/content?openDocId=${doc.id}`)
    setArtifact({
      documentId: doc.id,
      title: doc.title,
      kind: doc.kind as ArtifactKind,
      content: doc.content || '',
      isVisible: true,
      status: 'idle',
      displayMode: 'split',
      saveStatus: 'saved',
      boundingBox: { top: 0, left: 0, width: 0, height: 0 },
    })
    setOpenMobile(false)
  }

  return (
    <Sidebar>
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  if (sidebarState === 'collapsed') {
                    router.push('/')
                  } else {
                    setIsChatSectionCollapsed(!isChatSectionCollapsed)
                  }
                  setOpenMobile(false)
                }}
                isActive={isChatActive}
                tooltip={{ children: 'AI Чат', side: 'right' }}
                className="justify-between"
              >
                <div className="flex items-center gap-2">
                  <MessageCircleIcon size={18}/>
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
          </SidebarMenu>
          {!isChatSectionCollapsed && sidebarState === 'expanded' && (
            <SidebarHistory user={user}/>
          )}
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    if (sidebarState === 'collapsed') {
                      router.push('/content') // Обновленный маршрут
                    } else {
                      setIsContentSectionCollapsed(!isContentSectionCollapsed)
                    }
                    setOpenMobile(false)
                  }}
                  isActive={isContentActive}
                  tooltip={{ children: 'Контент', side: 'right' }}
                  className="justify-between"
                >
                  <div className="flex items-center gap-2">
                    <BoxIcon size={18}/> {/* Новая иконка */}
                    {sidebarState === 'expanded' && <span>Контент</span>}
                  </div>
                  {sidebarState === 'expanded' && (
                    <ChevronDownIcon
                      size={16}
                      className={`transition-transform duration-200 ${
                        isContentSectionCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {!isContentSectionCollapsed && sidebarState === 'expanded' && (
              <SidebarMenu>
                {isLoadingRecentContent && (
                  <div className="flex flex-col gap-1 px-2">
                    <Skeleton className="h-7 w-4/5"/>
                    <Skeleton className="h-7 w-3/5"/>
                  </div>
                )}
                {!isLoadingRecentContent && recentContent?.map((doc) => (
                  <SidebarContentItem
                    key={doc.id}
                    document={doc}
                    isActive={activeDocumentId === doc.id}
                    onClick={() => handleContentClick(doc)}
                  />
                ))}
                {!isLoadingRecentContent && (!recentContent || recentContent.length === 0) && (
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/70 text-center">Нет недавнего
                    контента.</div>
                )}
                <SidebarMenuItem className="mt-1">
                  <SidebarMenuButton
                    onClick={() => {
                      router.push('/content') // Обновленный маршрут
                      setOpenMobile(false)
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full justify-center"
                  >
                    <span>Весь контент</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarTrigger className="ml-auto hidden md:flex">
          <ChevronLeftIcon
            className={`transition-transform duration-200 ${sidebarState === 'collapsed' ? 'rotate-180' : 'rotate-0'}`}/>
        </SidebarTrigger>
      </SidebarFooter>
    </Sidebar>
  )
}

// END OF: components/app-sidebar.tsx
