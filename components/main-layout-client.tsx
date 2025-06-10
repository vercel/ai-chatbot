/**
 * @file components/main-layout-client.tsx
 * @description Клиентский компонент-обертка для основного макета приложения. Управляет сайдбаром и артефактом.
 * @version 1.8.3
 * @date 2025-06-10
 * @updated Removed unsupported 'votes' prop from Artifact component invocation (TS2322).
 */

/** HISTORY:
 * v1.8.3 (2025-06-10): Fixed TS2322 by removing the 'votes' prop from the Artifact component, as it is no longer a valid prop.
 * v1.8.2 (2025-06-06): Добавлена синхронизация состояния через onCollapse/onExpand.
 * v1.8.1 (2025-06-06): Улучшен UX ресайза сайдбара.
 * v1.8.0 (2025-06-06): Исправлена структура для корректного вызова хука и добавлено императивное управление панелью.
 */

'use client'

import * as React from 'react'
import { useWindowSize } from 'usehooks-ts'
import type { ImperativePanelGroupHandle, ImperativePanelHandle } from 'react-resizable-panels'
import type { Session } from 'next-auth'

import { AppSidebar } from '@/components/app-sidebar'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar'
import { Header } from '@/components/header'
import { Artifact } from '@/components/artifact'
import { useArtifactSelector } from '@/hooks/use-artifact'

function MainLayoutContent ({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const { isVisible: isArtifactVisible, displayMode: artifactDisplayMode } =
    useArtifactSelector(
      (state) => ({
        isVisible: state.isVisible,
        displayMode: state.displayMode,
      }),
    )

  const { state: sidebarState, setOpen } = useSidebar()
  const sidebarPanelRef = React.useRef<ImperativePanelHandle>(null)
  const contentPanelGroupRef = React.useRef<ImperativePanelGroupHandle>(null)

  const { width } = useWindowSize()
  const isMobile = width < 768

  React.useEffect(() => {
    const panelGroup = contentPanelGroupRef.current
    if (panelGroup) {
      if (!isArtifactVisible || isMobile) {
        panelGroup.setLayout([100, 0])
      } else if (artifactDisplayMode === 'split') {
        panelGroup.setLayout([50, 50])
      } else if (artifactDisplayMode === 'full') {
        panelGroup.setLayout([0, 100])
      }
    }
  }, [isArtifactVisible, artifactDisplayMode, isMobile])

  React.useEffect(() => {
    const panel = sidebarPanelRef.current
    if (panel) {
      if (sidebarState === 'collapsed' && !panel.isCollapsed()) {
        panel.collapse()
      } else if (sidebarState === 'expanded' && !panel.isExpanded()) {
        panel.expand()
      }
    }
  }, [sidebarState])

  return (
    <div className="flex flex-col h-dvh w-full bg-background">
      <Header/>
      <div className="flex flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            ref={sidebarPanelRef}
            onCollapse={() => {
              if (sidebarState === 'expanded') {
                setOpen(false)
              }
            }}
            onExpand={() => {
              if (sidebarState === 'collapsed') {
                setOpen(true)
              }
            }}
            defaultSize={16}
            minSize={17}
            maxSize={25}
            collapsible={true}
            collapsedSize={5}
          >
            <AppSidebar user={session?.user}/>
          </ResizablePanel>
          <ResizableHandle withHandle disabled={sidebarState === 'collapsed'}/>
          <ResizablePanel defaultSize={84}>
            <ResizablePanelGroup direction="horizontal" ref={contentPanelGroupRef}>
              <ResizablePanel defaultSize={100} minSize={0}>
                <main className="h-full">
                  {children}
                </main>
              </ResizablePanel>
              {isArtifactVisible && !isMobile && <ResizableHandle withHandle/>}
              <ResizablePanel defaultSize={0} minSize={0}>
                <Artifact
                  chatId="global-artifact"
                  input=""
                  setInput={() => {}}
                  status="ready"
                  stop={() => {}}
                  attachments={[]}
                  setAttachments={() => {}}
                  messages={[]}
                  setMessages={() => {}}
                  append={() => Promise.resolve(null)}
                  handleSubmit={() => {}}
                  reload={() => Promise.resolve(null)}
                  isReadonly={false}
                  selectedVisibilityType="private"
                  session={session}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

export function MainLayoutClient ({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const { width } = useWindowSize()
  const isMobile = width < 768

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <MainLayoutContent session={session}>
        {children}
      </MainLayoutContent>
    </SidebarProvider>
  )
}

// END OF: components/main-layout-client.tsx
