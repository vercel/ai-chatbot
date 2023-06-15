'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'
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
import { IconMessage, IconSpinner, IconTrash } from '@/components/ui/icons'

interface SidebarItemProps {
  title: string
  href: string
  id: string
  removeChat: (args: { id: string; path: string }) => Promise<void>
}

export function SidebarItem({ title, href, id, removeChat }: SidebarItemProps) {
  const [open, setIsOpen] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const isActive = pathname === href

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
        <IconMessage className="mr-2" />
        <div
          className="relative max-h-5 flex-1 select-none overflow-hidden text-ellipsis break-all"
          title={title}
        >
          <span className="whitespace-nowrap">{title}</span>
        </div>
        {isActive && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isPending}
            onClick={() => setIsOpen(true)}
          >
            <IconTrash />
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
                  await removeChat({ id, path: href })
                  setIsOpen(false)
                  router.push('/')
                })
              }}
            >
              {isPending && <IconSpinner className="mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
