'use client'
import { ThemeToggle } from '@/components/theme-toggle'
import { type Session } from '@auth/nextjs/types'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { signIn } from '@auth/nextjs/client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export interface UserMenuProps {
  session: Session
}

export function UserMenu({ session }: UserMenuProps) {
  const router = useRouter()
  return (
    <div className="flex items-center justify-between">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="focus:outline-none">
            {session.user?.image ? (
              <Image
                width={24}
                height={24}
                className="h-6 w-6 rounded-full select-none ring-zinc-100/10 ring-1 hover:opacity-80 transition-opacity duration-300"
                src={session.user?.image ? `${session.user.image}&s=60` : ''}
                alt={session.user.name ?? 'Avatar'}
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 p-2 select-none">
                <div
                  className="font-medium uppercase text-zinc-100"
                  style={{ fontSize: 12 }}
                >
                  {session.user?.name ? session.user?.name.slice(0, 2) : null}
                </div>
              </div>
            )}
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[200px] bg-white dark:bg-zinc-950 rounded-lg shadow-lg text-zinc-900 dark:text-zinc-400 overflow-hidden border border-transparent dark:border-zinc-700 focus:outline-none relative z-20 py-2"
            sideOffset={8}
            align="end"
          >
            <DropdownMenu.Item className="py-2 px-3 focus:outline-none">
              <div className="text-xs font-medium">{session.user?.name}</div>
              <div className="text-xs text-zinc-500">{session.user?.email}</div>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-[1px] bg-zinc-100 dark:bg-zinc-800" />
            <DropdownMenu.Item className="py-2 px-3 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors duration-200 cursor-pointer text-xs focus:outline-none">
              <ThemeToggle />
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-[1px] bg-zinc-100 dark:bg-zinc-800" />
            <DropdownMenu.Item className="py-2 px-3 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors duration-200 cursor-pointer text-xs focus:outline-none ">
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between w-full"
              >
                <span>Vercel Homepage</span>
                <span>
                  <svg
                    fill="none"
                    height={16}
                    shapeRendering="geometricPrecision"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    width={16}
                    aria-hidden="true"
                    className="mr-1"
                  >
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <path d="M15 3h6v6" />
                    <path d="M10 14L21 3" />
                  </svg>
                </span>
              </a>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="py-2 px-3 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors duration-200 cursor-pointer text-xs focus:outline-none"
              onClick={() => router.push('/api/auth/signout')}
            >
              Log Out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

UserMenu.displayName = 'UserMenu'
