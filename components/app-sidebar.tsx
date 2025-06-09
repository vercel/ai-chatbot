/**
 * @file components/app-sidebar.tsx
 * @description Компонент боковой панели приложения с навигацией.
 * @version 2.0.0
 * @date 2025-06-09
 * @updated Рефакторинг. "Контент" переименован в "Артефакты", обновлены маршруты и API-вызовы.
 */

/** HISTORY:
 * v2.0.0 (2025-06-09): Рефакторинг "Контент" -> "Артефакты", обновлены маршруты и API.
 * v1.8.0 (2025-06-06): Исправлена структура SidebarMenu/SidebarMenuItem.
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
import type { Artifact as DBArtifact } from '@/lib/db/schema'
import useSWR from 'swr'
import { fetcher } from '@/lib/utils'
import { useArtifact } from '@/hooks/use-artifact'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from './toast'
import type { ArtifactKind } from './artifact'

interface SidebarArtifactItemProps {
  artifact: Pick<DBArtifact, 'id' | 'title' | 'createdAt' | 'kind' | 'content'>;
  isActive: boolean;
  onClick: () => void;
}

function SidebarArtifactItem ({ artifact: doc, isActive, onClick }: SidebarArtifactItemProps) {
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
  const [isArtifactsSectionCollapsed, setIsArtifactsSectionCollapsed] = useLocalStorage(
    'sidebar:isArtifactsSectionCollapsed',
    true,
    { initializeWithValue: false }
  )

  const isChatActive = pathname.startsWith('/chat') || pathname === '/'
  const isArtifactsActive = pathname.startsWith('/artifacts')

  const {
    data: recentArtifacts,
    isLoading: isLoadingRecentArtifacts,
  } = useSWR<Array<Pick<DBArtifact, 'id' | 'title' | 'createdAt' | 'kind' | 'content'>>>(
    user ? `/api/artifacts/recent?limit=5` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const { setArtifact } = useArtifact()
  const artifactHook = useArtifact()
  const activeArtifactId = artifactHook.artifact.isVisible ? artifactHook.artifact.artifactId : null

  const handleArtifactClick = (doc: Pick<DBArtifact, 'id' | 'title' | 'kind' | 'content'>) => {
    if (!doc.kind) {
      console.error('SYS_COMP_APP_SIDEBAR: Artifact kind is undefined, cannot open.', doc)
      toast({ type: 'error', description: 'Не удалось определить тип артефакта.' })
      return
    }
    toast({ type: 'loading', description: `Открываю "${doc.title}"...` })
    router.push(`/artifacts?openArtifactId=${doc.id}`)
    setArtifact({
      artifactId: doc.id,
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
                      router.push('/artifacts')
                    } else {
                      setIsArtifactsSectionCollapsed(!isArtifactsSectionCollapsed)
                    }
                    setOpenMobile(false)
                  }}
                  isActive={isArtifactsActive}
                  tooltip={{ children: 'Артефакты', side: 'right' }}
                  className="justify-between"
                >
                  <div className="flex items-center gap-2">
                    <BoxIcon size={18}/>
                    {sidebarState === 'expanded' && <span>Мои Артефакты</span>}
                  </div>
                  {sidebarState === 'expanded' && (
                    <ChevronDownIcon
                      size={16}
                      className={`transition-transform duration-200 ${
                        isArtifactsSectionCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {!isArtifactsSectionCollapsed && sidebarState === 'expanded' && (
              <SidebarMenu>
                {isLoadingRecentArtifacts && (
                  <div className="flex flex-col gap-1 px-2">
                    <Skeleton className="h-7 w-4/5"/>
                    <Skeleton className="h-7 w-3/5"/>
                  </div>
                )}
                {!isLoadingRecentArtifacts && recentArtifacts?.map((doc) => (
                  <SidebarArtifactItem
                    key={doc.id}
                    artifact={doc}
                    isActive={activeArtifactId === doc.id}
                    onClick={() => handleArtifactClick(doc)}
                  />
                ))}
                {!isLoadingRecentArtifacts && (!recentArtifacts || recentArtifacts.length === 0) && (
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/70 text-center">Нет недавних
                    артефактов.</div>
                )}
                <SidebarMenuItem className="mt-1">
                  <SidebarMenuButton
                    onClick={() => {
                      router.push('/artifacts')
                      setOpenMobile(false)
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full justify-center"
                  >
                    <span>Все артефакты</span>
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
