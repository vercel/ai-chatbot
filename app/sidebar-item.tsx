'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MessageCircleIcon, Trash2Icon, Loader2Icon } from 'lucide-react'
import { removeChat } from './actions'
import { useTransition } from 'react'

export function SidebarItem({
  title,
  href,
  id,
  userId
}: {
  title: string
  href: string
  id: string
  userId: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const active = pathname === href
  const [isPending, startTransition] = useTransition()

  if (!id) return null

  return (
    <Link
      href={href}
      className={cn(
        'group flex shrink-0 cursor-pointer items-center gap-2 rounded p-2 text-sm font-medium transition-colors duration-100 hover:bg-zinc-500/10 hover:dark:bg-zinc-300/20',
        isPending
          ? 'text-zinc-400 dark:text-zinc-500'
          : 'text-zinc-800 dark:text-zinc-400',
        active
          ? 'bg-zinc-500/20 text-zinc-900 font-semibold hover:bg-zinc-500/30 dark:text-white'
          : 'bg-transparent'
      )}
    >
      <MessageCircleIcon className="h-4 w-4" />
      <div
        className="relative max-h-5 flex-1 overflow-hidden text-ellipsis break-all select-none"
        title={title}
      >
        <span className="whitespace-nowrap">{title}</span>
      </div>
      <button
        className="opacity-0 -mr-6 transition-opacity duration-0 hover:bg-zinc-400/50 group-hover:mr-0 group-hover:opacity-80 p-1 -my-1 rounded group-hover:duration-600"
        disabled={isPending}
        onClick={e => {
          e.preventDefault()
          startTransition(() => {
            removeChat({ id, userId, path: href }).then(() => {
              router.push('/')
            })
          })
        }}
      >
        {isPending ? (
          <Loader2Icon className="animate-spin h-4 w-4" />
        ) : (
          <Trash2Icon className="h-4 w-4" />
        )}
      </button>
    </Link>
  )
}
