'use client'

import * as React from 'react'
import { useTransition } from 'react'
import { Loader2Icon, MessageSquare, Trash2Icon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'
import { removeChat } from '@/app/actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'

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
  const [open, setIsOpen] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isActive = pathname === href
  const [isPending, startTransition] = useTransition()

  if (!id) return null

  return (
    <>
      <Link
        href={href}
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'group w-full px-2',
          isActive && 'bg-accent'
        )}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        <div
          className="relative max-h-5 flex-1 overflow-hidden text-ellipsis break-all select-none"
          title={title}
        >
          <span className="whitespace-nowrap">{title}</span>
        </div>
        {isActive && (
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            disabled={isPending}
            onClick={() => setIsOpen(true)}
          >
            <Trash2Icon className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        )}
      </Link>
      <AlertDialog open={open} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your chat message and remove your
              data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={event => {
                event.preventDefault()
                startTransition(async () => {
                  await removeChat({ id, userId, path: href })
                  setIsOpen(false)
                  router.push('/')
                })
              }}
            >
              {isPending && (
                <Loader2Icon className="animate-spin h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
