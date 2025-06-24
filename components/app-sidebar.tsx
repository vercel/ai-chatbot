"use client"

import * as React from "react"
import type { User } from 'next-auth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArchiveX, Command, File, Inbox, Send, Trash2, MessageSquare, PlusIcon } from "lucide-react"
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

// This is sample data
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Chat History",
      url: "#",
      icon: MessageSquare,
      isActive: true,
    },
  //   {
  //     title: "Inbox",
  //     url: "#",
  //     icon: Inbox,
  //     isActive: false,
  //   },
  //   {
  //     title: "Drafts",
  //     url: "#",
  //     icon: File,
  //     isActive: false,
  //   },
  //   {
  //     title: "Sent",
  //     url: "#",
  //     icon: Send,
  //     isActive: false,
  //   },
  //   {
  //     title: "Junk",
  //     url: "#",
  //     icon: ArchiveX,
  //     isActive: false,
  //   },
  //   {
  //     title: "Trash",
  //     url: "#",
  //     icon: Trash2,
  //     isActive: false,
  //   },
   ],
  // Commented out mail data since we're not using it anymore
  // mails: [
  //   {
  //     name: "William Smith",
  //     email: "williamsmith@example.com",
  //     subject: "Meeting Tomorrow",
  //     date: "09:34 AM",
  //     teaser:
  //       "Hi team, just a reminder about our meeting tomorrow at 10 AM.\nPlease come prepared with your project updates.",
  //   },
  //   // ... rest of mail data
  // ],
}

export function AppSidebar({ user, ...props }: { user: User | undefined } & React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const [activeItem, setActiveItem] = React.useState(data.navMain[0])
  const { setOpen, setOpenMobile } = useSidebar()

  // // Handler for logo click to open chat history
  // const handleLogoClick = (e: React.MouseEvent) => {
  //   e.preventDefault();
  //   const chatHistoryItem = data.navMain.find(item => item.title === "Chat History");
  //   if (chatHistoryItem) {
  //     setActiveItem(chatHistoryItem);
  //     setOpen(true);
  //   }
  // };

  // Function to render content based on active item
  const renderContent = () => {
    switch (activeItem?.title) {
      case "Chat History":
        return (
          <div className="p-2">
            <SidebarHistory  user={user} />
          </div>
        );
      
      case "Inbox":
        // TODO: Add Inbox component here
        return (
          <div className="p-4 text-sm text-muted-foreground">
            Inbox component will be added here
          </div>
        );
      
      case "Drafts":
        // TODO: Add Drafts component here
        return (
          <div className="p-4 text-sm text-muted-foreground">
            Drafts component will be added here
          </div>
        );
      
      case "Sent":
        // TODO: Add Sent component here
        return (
          <div className="p-4 text-sm text-muted-foreground">
            Sent component will be added here
          </div>
        );
      
      case "Junk":
        // TODO: Add Junk component here
        return (
          <div className="p-4 text-sm text-muted-foreground">
            Junk component will be added here
          </div>
        );
      
      case "Trash":
        // TODO: Add Trash component here
        return (
          <div className="p-4 text-sm text-muted-foreground">
            Trash component will be added here
          </div>
        );
      
      default:
        return (
          <div className="p-4 text-sm text-muted-foreground">
            Select an item from the sidebar
          </div>
        );
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row !bg-[rgba(16,185,129,0.1)]"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r !bg-[rgba(16,185,129,0.1)]"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0 hover:bg-transparent">
                <a>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg ">
                    <Image src="/images/logo.svg" alt="CoCo AI Coach" width={32} height={32} className="size-8" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight ml-3">
                    <span className="truncate font-semibold">CoCo - AI Coach</span>
                    <span className="truncate text-xs">Enterprise</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setActiveItem(item)
                        setOpen(true)
                      }}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2 data-[state=open]:hover:bg-transparent data-[active=true]:bg-transparent hover:bg-[rgba(16,185,129,0.2)]"
                    >
                      <item.icon className="text-black" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {user && <SidebarUserNav user={user} />}
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex !bg-[rgba(16,185,129,0.1)]">
        <SidebarHeader className="gap-3.5 border-b p-4 mr-10">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">
              {activeItem?.title}
            </div>
            {activeItem?.title === "Chat History" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    type="button"
                    className="p-2 h-fit hover:bg-transparent"
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
            ) : (
              <Label className="flex items-center gap-2 text-sm">
                <span>Unreads</span>
                <Switch className="shadow-none" />
              </Label>
            )}
          </div>
          <SidebarInput placeholder={activeItem?.title === "Chat History" ? "Search chats..." : `Search ${activeItem?.title.toLowerCase()}...`} />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="pr-10">
            <SidebarGroupContent >
              <div></div>
              {renderContent()}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}