'use client';

import Link from 'next/link';
import { type User } from 'next-auth';

import { PlusIcon, VercelIcon } from '@/components/custom/icons';
import { SidebarHistory } from '@/components/custom/sidebar-history';
import { SidebarUserNav } from '@/components/custom/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { BetterTooltip } from '@/components/ui/tooltip';

export function AppSidebar({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => setOpenMobile(false)}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2">Chatbot</span>
            </Link>
            <BetterTooltip content="New Chat" align="start">
              <Button variant="ghost" className="p-2 h-fit">
                <Link href="/" onClick={() => setOpenMobile(false)}>
                  <PlusIcon />
                </Link>
              </Button>
            </BetterTooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarHistory user={user} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <Card className="p-4 flex flex-col gap-4 relative rounded-lg shadow-none border-none">
              <a
                href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET,OPENAI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI%20Chatbot&demo-description=An%20Open-Source%20AI%20Chatbot%20Template%20Built%20With%20Next.js%20and%20the%20AI%20SDK%20by%20Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&stores=[{%22type%22:%22postgres%22},{%22type%22:%22blob%22}]"
                className="absolute inset-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">Deploy</span>
              </a>
              <CardHeader className="p-0">
                <CardTitle className="text-base">Deploy your own</CardTitle>
                <CardDescription className="text-sm">
                  Open Source Chatbot template built with Next.js and the AI SDK
                  by Vercel.
                </CardDescription>
              </CardHeader>
              <CardFooter className="p-0">
                <Button size="sm" className="w-full h-8 py-0 justify-start">
                  <VercelIcon size={16} />
                  Deploy with Vercel
                </Button>
              </CardFooter>
            </Card>
          </SidebarGroupContent>
        </SidebarGroup>
        {user && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarUserNav user={user} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
