/**
 * @file components/main-layout-client.tsx
 * @description Клиентский компонент-обертка для основного макета приложения. Управляет сайдбаром и артефактом.
 * @version 1.6.2
 * @date 2025-06-06
 * @updated Исправлена ошибка типизации для пропса 'reload' в компоненте Artifact.
 */

/** HISTORY:
 * v1.6.2 (2025-06-06): Исправлен тип для 'reload' в Artifact.
 * v1.6.1 (2025-06-06): Исправлены типы для 'status' и 'reload' в Artifact.
 * v1.6.0 (2025-06-06): Изменен minSize у ResizablePanel контента на 0 для корректной работы fullscreen.
 * v1.5.0 (2025-06-06): Полный рефакторинг макета на 3 зоны: Sidebar, Content, Artifact.
 * v1.4.0 (2025-06-05): Глобальный рефакторинг с Header и ResizablePanelGroup.
 * v1.3.0 (2025-06-05): Внедрен ResizablePanelGroup и Header.
 * v1.2.0 (2025-06-05): Замена условного padding на двухпанельный Flexbox-макет.
 * v1.1.0 (2025-06-05): Замена CSS Grid на условный padding-right.
 * v1.0.0 (2025-06-05): Начальная версия.
 */

'use client';

import * as React from 'react';
import { useWindowSize } from 'usehooks-ts';
import type { ImperativePanelGroupHandle } from 'react-resizable-panels';
import type { Session } from 'next-auth';

import { AppSidebar } from '@/components/app-sidebar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Header } from '@/components/header';
import { Artifact } from '@/components/artifact';
import { useArtifactSelector } from '@/hooks/use-artifact';

export function MainLayoutClient({
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
    );

  const contentPanelGroupRef = React.useRef<ImperativePanelGroupHandle>(null);

  const { width } = useWindowSize();
  const isMobile = width < 768;

  React.useEffect(() => {
    const panelGroup = contentPanelGroupRef.current;
    if (panelGroup) {
      if (!isArtifactVisible || isMobile) {
        panelGroup.setLayout([100, 0]);
      } else if (artifactDisplayMode === 'split') {
        panelGroup.setLayout([50, 50]);
      } else if (artifactDisplayMode === 'full') {
        panelGroup.setLayout([0, 100]);
      }
    }
  }, [isArtifactVisible, artifactDisplayMode, isMobile]);

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex flex-col h-dvh w-full bg-background">
        <Header />
        <div className="flex flex-1 overflow-hidden">
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel
                defaultSize={16}
                minSize={15}
                maxSize={25}
                collapsible={true}
                collapsedSize={4}
              >
                <AppSidebar user={session?.user} />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel>
                  <ResizablePanelGroup direction="horizontal" ref={contentPanelGroupRef}>
                    <ResizablePanel defaultSize={100} minSize={0}>
                      <main className="h-full">
                         {children}
                      </main>
                    </ResizablePanel>
                    {isArtifactVisible && !isMobile && <ResizableHandle withHandle />}
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
                        votes={undefined}
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
    </SidebarProvider>
  );
}

// END OF: components/main-layout-client.tsx
