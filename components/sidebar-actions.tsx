'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

import { Share, type Chat, ServerActionResult } from '@/lib/types'
import { formatDate } from '@/lib/utils'
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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { IconShare, IconSpinner, IconTrash } from '@/components/ui/icons'

interface SidebarActionsProps {
  chat: Chat
  removeChat: (args: { id: string; path: string }) => Promise<void>
  shareChat: (chat: Chat) => ServerActionResult<Share>
}

export function SidebarActions({
  chat,
  removeChat,
  shareChat
}: SidebarActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
  const [isRemovePending, startRemoveTransition] = React.useTransition()
  const [isSharePending, startShareTransition] = React.useTransition()
  const router = useRouter()

  return (
    <>
      <div className="space-x-1">
        <Button
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-background"
          onClick={() => setShareDialogOpen(true)}
        >
          <IconShare />
          <span className="sr-only">Share</span>
        </Button>
        <Button
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-background"
          disabled={isRemovePending}
          onClick={() => setDeleteDialogOpen(true)}
        >
          <IconTrash />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share link to chat</DialogTitle>
            <DialogDescription>
              Messages you send after creating your link won&apos;t be shared.
              Anyone with the URL will be able to view the shared chat.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 rounded-md border p-4 text-sm">
            <div className="font-medium">{chat.title}</div>
            <div className="text-muted-foreground">
              {formatDate(chat.createdAt)}
            </div>
          </div>
          <DialogFooter className="items-center">
            <p className="mr-auto text-sm text-muted-foreground">
              Any link you have shared before will be deleted.
            </p>
            <Button
              disabled={isSharePending}
              onClick={() => {
                startShareTransition(async () => {
                  const result = await shareChat(chat)

                  if (!('id' in result)) {
                    toast.error(result.message)
                    return
                  }

                  const url = new URL(window.location.href)
                  url.pathname = result.path
                  navigator.clipboard.writeText(url.toString())
                  setShareDialogOpen(false)
                  toast.success('Share link copied to clipboard', {
                    style: {
                      borderRadius: '10px',
                      background: '#333',
                      color: '#fff',
                      fontSize: '14px'
                    },
                    iconTheme: {
                      primary: 'white',
                      secondary: 'black'
                    }
                  })
                })
              }}
            >
              {isSharePending ? (
                <>
                  <IconSpinner className="mr-2 animate-spin" />
                  Copying...
                </>
              ) : (
                <>Copy link</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your chat message and remove your
              data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovePending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRemovePending}
              onClick={event => {
                event.preventDefault()
                startRemoveTransition(async () => {
                  await removeChat({
                    id: chat.id,
                    path: chat.path
                  })
                  setDeleteDialogOpen(false)
                  router.push('/')
                })
              }}
            >
              {isRemovePending && <IconSpinner className="mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
