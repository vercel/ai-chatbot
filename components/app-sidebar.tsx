'use client';

import { useEffect } from 'react';
import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { PersonaSwitcher } from '@/components/persona-switcher';

export function AppSidebar({ user }: Readonly<{ user: User | undefined }>) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + N: New Chat
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        router.push('/');
        router.refresh();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                Chatbot
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/');
                    router.refresh();
                  }}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>

      {/* Quick Actions Section */}
      <div className="p-2 border-t border-sidebar-border">
        <div className="text-xs font-medium text-sidebar-foreground/70 mb-2 px-2">
          Ações Rápidas
        </div>
        <div className="space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-sm text-sidebar-foreground/60 px-2 py-1 hover:bg-sidebar-accent rounded cursor-pointer flex justify-between items-center w-full text-left"
                onClick={() => {
                  router.push('/');
                  router.refresh();
                }}
              >
                <span>⚡ Novo Chat</span>
                <span className="text-xs opacity-50">Ctrl+N</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Criar novo chat (Ctrl+N)</TooltipContent>
          </Tooltip>
          <div className="text-sm text-sidebar-foreground/60 px-2 py-1 hover:bg-sidebar-accent rounded cursor-pointer">
            📋 Criar Artefato
          </div>
          <div className="text-sm text-sidebar-foreground/60 px-2 py-1 hover:bg-sidebar-accent rounded cursor-pointer">
            🔍 Buscar no Histórico
          </div>
          <div className="text-sm text-sidebar-foreground/60 px-2 py-1 hover:bg-sidebar-accent rounded cursor-pointer">
            ⚙️ Configurações
          </div>
        </div>
      </div>

      {/* Artifacts Section */}
      <div className="p-2 border-t border-sidebar-border">
        <div className="text-xs font-medium text-sidebar-foreground/70 mb-2 px-2">
          Artefatos Disponíveis
        </div>
        <div className="space-y-1">
          <div className="text-sm text-sidebar-foreground/60 px-2 py-1 hover:bg-sidebar-accent rounded cursor-pointer">
            📄 Documento de Texto
          </div>
          <div className="text-sm text-sidebar-foreground/60 px-2 py-1 hover:bg-sidebar-accent rounded cursor-pointer">
            💻 Código
          </div>
          <div className="text-sm text-sidebar-foreground/60 px-2 py-1 hover:bg-sidebar-accent rounded cursor-pointer">
            🖼️ Imagem
          </div>
          <div className="text-sm text-sidebar-foreground/60 px-2 py-1 hover:bg-sidebar-accent rounded cursor-pointer">
            📊 Planilha
          </div>
        </div>
      </div>

      {/* Journey Navigation Section */}
      <div className="p-2 border-t border-sidebar-border">
        <div className="text-xs font-medium text-sidebar-foreground/70 mb-2 px-2">
          Jornada Solar
        </div>
        <div className="text-sm text-sidebar-foreground/60 px-2">
          Navegue pelas fases do processo de vendas solares
        </div>
      </div>

      <SidebarFooter>
        <div className="p-2 space-y-3">
          {/* Persona Section */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-sidebar-foreground/70 px-2">
              Modo de Persona
            </div>
            <PersonaSwitcher />
          </div>

          {/* User Section */}
          {user && (
            <div className="border-t border-sidebar-border pt-2">
              <SidebarUserNav user={user} />
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}