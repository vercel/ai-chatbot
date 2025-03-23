'use client'

import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Component() {

    const router = useRouter()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary p-2 text-primary-foreground bg-zinc-900">
          <MessageCircle className="h-6 w-6" />
        </div>
      </div>
      <h1 className="text-4xl font-bold">Something went wrong</h1>
      <p className="text-lg text-muted-foreground">
        We encountered an error while processing your request.
      </p>
      <div className="flex gap-2">
        <Button className="bg-zinc-900 hover:bg-zinc-950" onClick={() => router.refresh()} variant="outline">
          Try again
        </Button>
        <Button asChild className="bg-zinc-900 hover:bg-zinc-950">
          <Link href="/">Return home</Link>
        </Button>
      </div>
      <p className="max-w-[500px] text-sm text-muted-foreground">
        If this issue persists, please contact support with error code: {new Date().getTime().toString(36).toUpperCase()}
      </p>
    </div>
  )
}